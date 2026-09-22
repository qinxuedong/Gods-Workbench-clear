# -*- coding: utf-8 -*-
"""认证事件审计落点（D12 修复）。

背景：``core/session.py`` / ``api/routes_auth.py`` / ``core/oidc.py`` /
``core/auth.py`` / ``api/app.py`` 此前**完全没有**审计落点
（``git grep -n "logging." -- src`` 为空），登录成功、登出、state 失配、
id_token 被拒、角色映射失败等认证事件**无处留痕**。本模块补上最小可用的
审计落点，使 ``真实外部 IdP 接线`` 具备可追溯性。

安全口径（与 ``core/oidc.py`` / ``core/session.py`` 配套）：

- **白名单字段**：只记录 ``event`` / ``outcome`` / ``reason`` / ``subject`` /
  ``role`` / ``auth_mode`` / ``at`` 七个字段；调用方无法把任意对象塞进记录里。
- **绝不记录凭据**：令牌原文、授权码、``code_verifier``、``state`` / ``nonce``、
  Cookie 值（含不透明会话标识）**一律不入账**。``subject`` 为 IdP 的 ``sub``
  伪匿名标识，不含口令或令牌。
- **长度封顶**：``reason`` / ``subject`` / ``role`` / ``auth_mode`` 均截断到
  固定上限，避免攻击者用超长取值放大内存占用。
- **有界内存**：环形缓冲默认保留最近 ``AUDIT_MAX_EVENTS`` 条，超出即丢弃最旧
  记录（不会无界增长）。

证据边界（**不得外推**）

- 本模块是**进程内内存**落点：进程重启即丢失，多实例/多 worker 之间**不共享**。
  持久化审计库 / 外部 SIEM / 多实例一致性属**部署方职责**，在本切片**未闭环**。
- 同时通过标准库 ``logging``（logger 名 ``gods_workbench.audit``）以 INFO 级别
  发出一条结构化记录，便于部署方接入既有日志管道；本仓**不**内置文件落盘与
  保留策略，也**不**宣称已满足任何合规留存要求。
- 落点存在**不等于**通过第三方独立审计，更**不等于**发布授权。
"""

from __future__ import annotations

import json
import logging
import threading
import time
from collections import deque
from typing import Any, Deque, Dict, List, Optional

logger = logging.getLogger("gods_workbench.audit")

# 环形缓冲容量：只保留最近 N 条认证事件，保证内存有界。
AUDIT_MAX_EVENTS = 2048

# 单个字段的字符上限，避免攻击者用超长取值放大内存占用。
_MAX_FIELD_CHARS = 256

# 认证事件名的**封闭集合**：拼写漂移会在测试期被立刻发现，而不是静默写错账。
EVENT_LOGIN_STARTED = "auth.login.started"
EVENT_LOGIN_DENIED = "auth.login.denied"
EVENT_LOGIN_ALREADY_AUTHENTICATED = "auth.login.already_authenticated"
EVENT_SESSION_ESTABLISHED = "auth.session.established"
EVENT_CALLBACK_REJECTED = "auth.callback.rejected"
EVENT_TOKEN_REJECTED = "auth.token.rejected"
EVENT_ROLE_REJECTED = "auth.role.rejected"
EVENT_LOGOUT = "auth.logout"

AUTH_EVENT_NAMES = frozenset(
    {
        EVENT_LOGIN_STARTED,
        EVENT_LOGIN_DENIED,
        EVENT_LOGIN_ALREADY_AUTHENTICATED,
        EVENT_SESSION_ESTABLISHED,
        EVENT_CALLBACK_REJECTED,
        EVENT_TOKEN_REJECTED,
        EVENT_ROLE_REJECTED,
        EVENT_LOGOUT,
    }
)

# 事件结果口径同样封闭，避免出现无意义的自由文本。
OUTCOME_STARTED = "started"
OUTCOME_SUCCEEDED = "succeeded"
OUTCOME_DENIED = "denied"
OUTCOME_REJECTED = "rejected"

AUTH_OUTCOMES = frozenset(
    {
        OUTCOME_STARTED,
        OUTCOME_SUCCEEDED,
        OUTCOME_DENIED,
        OUTCOME_REJECTED,
    }
)

_AUTH_EVENTS: Deque[Dict[str, Any]] = deque(maxlen=AUDIT_MAX_EVENTS)
_LOCK = threading.Lock()


def _clip(value: Optional[str]) -> str:
    """把可选字符串裁剪为定长安全值；非字符串一律降级为空串。"""
    if not isinstance(value, str):
        return ""
    if len(value) <= _MAX_FIELD_CHARS:
        return value
    return value[:_MAX_FIELD_CHARS]


def record_auth_event(
    event: str,
    *,
    outcome: str,
    reason: str = "",
    subject: Optional[str] = None,
    role: Optional[str] = None,
    auth_mode: Optional[str] = None,
) -> Dict[str, Any]:
    """记录一条认证事件并返回脱敏后的记录。

    ``event`` 与 ``outcome`` 必须落在封闭集合内，否则抛 ``ValueError``
    （拼写错误的审计事件属于代码缺陷，应当立刻失败，而不是静默写入脏账）。
    记录只包含白名单字段，调用方**无法**把令牌等任意对象带进审计。
    """
    if event not in AUTH_EVENT_NAMES:
        raise ValueError("未知的认证事件名，已拒绝记录")
    if outcome not in AUTH_OUTCOMES:
        raise ValueError("未知的认证事件结果，已拒绝记录")

    record: Dict[str, Any] = {
        "event": event,
        "outcome": outcome,
        "reason": _clip(reason),
        "subject": _clip(subject),
        "role": _clip(role),
        "auth_mode": _clip(auth_mode),
        "at": time.time(),
    }

    with _LOCK:
        _AUTH_EVENTS.append(record)

    # 结构化日志：只发白名单字段。禁用 logger 时该调用代价可忽略。
    if logger.isEnabledFor(logging.INFO):
        logger.info("auth_audit %s", json.dumps(record, ensure_ascii=False, sort_keys=True))
    return dict(record)


def list_auth_events() -> List[Dict[str, Any]]:
    """按发生顺序返回当前进程内的审计记录快照（供核验与测试）。"""
    with _LOCK:
        return [dict(item) for item in _AUTH_EVENTS]


def auth_event_count() -> int:
    """返回当前进程内已保留的审计记录条数。"""
    with _LOCK:
        return len(_AUTH_EVENTS)


def reset_audit_log() -> None:
    """清空审计缓冲（供测试与重启语义使用）。"""
    with _LOCK:
        _AUTH_EVENTS.clear()
