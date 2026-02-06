const userAgent = process.env.npm_config_user_agent || ''

if (!userAgent.includes('pnpm/')) {
  console.error('This repository uses pnpm. Run commands with pnpm.')
  process.exit(1)
}

