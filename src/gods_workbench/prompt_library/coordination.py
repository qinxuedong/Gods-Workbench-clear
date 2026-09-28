# -*- coding: utf-8 -*-
"""提示词库树与条目共享的单进程写入协调域。"""

from threading import RLock

# 父项校验、非空判断与子项提交必须处于同一个临界区。
PROMPT_LIBRARY_DOMAIN_LOCK = RLock()
