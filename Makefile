# Быстрый запуск теста prxz.min.js:  make run next   или   make run-next
.PHONY: next run-next

next:
	cd next_test && node run.js

run-next: next
