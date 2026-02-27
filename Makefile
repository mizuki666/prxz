# Песочница prxz.min.js (React + Vite):  make run react   или   make run-react
.PHONY: react run-react

react:
	cd react_test && npm run dev

run-react: react
