import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const REPO_NAME = 'ayan-aji-nair.github.io'

export default defineConfig({
	plugins: [react()],
	base: '/',
})
