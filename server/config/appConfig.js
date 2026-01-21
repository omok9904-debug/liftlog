const MAX_SIGNUPS = Number.parseInt(process.env.MAX_SIGNUPS ?? '10', 10) || 10

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'INDIA@11'

module.exports = {
  MAX_SIGNUPS,
  ADMIN_SECRET_KEY,
}
