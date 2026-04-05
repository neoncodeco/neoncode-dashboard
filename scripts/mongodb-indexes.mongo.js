// Run this in Mongo shell / mongosh against your Neon-Code-Dollar database.
// Example:
// use("Neon-Code-Dollar")
// load("scripts/mongodb-indexes.mongo.js")

// USERS
db.users.createIndex({ userId: 1 }, { unique: true, name: "uid_unique" })
db.users.createIndex({ email: 1 }, { unique: true, sparse: true, name: "email_unique" })
db.users.createIndex({ referralCode: 1 }, { unique: true, sparse: true, name: "referral_code_unique" })
db.users.createIndex({ createdAt: -1 }, { name: "users_createdAt_desc" })
db.users.createIndex({ passwordResetTokenHash: 1 }, { sparse: true, name: "password_reset_token_hash" })

// SETTINGS
db.settings.createIndex({ key: 1 }, { unique: true, name: "settings_key_unique" })

// PAYMENTS
db.payments.createIndex({ trx_id: 1 }, { unique: true, sparse: true, name: "payments_trx_id_unique" })
db.payments.createIndex({ userUid: 1, createdAt: -1 }, { name: "payments_userUid_createdAt_desc" })
db.payments.createIndex({ status: 1, createdAt: -1 }, { name: "payments_status_createdAt_desc" })
db.payments.createIndex({ createdAt: -1 }, { name: "payments_createdAt_desc" })

// AD ACCOUNT REQUESTS
db.adAccountRequests.createIndex({ userUid: 1, createdAt: -1 }, { name: "ad_requests_userUid_createdAt_desc" })
db.adAccountRequests.createIndex({ status: 1, createdAt: -1 }, { sparse: true, name: "ad_requests_status_createdAt_desc" })
db.adAccountRequests.createIndex({ createdAt: -1 }, { name: "ad_requests_createdAt_desc" })

// ADS SPENDING LIMIT LOGS
db.ads_spending_limit_logs.createIndex({ timestamp: -1 }, { name: "spending_logs_timestamp_desc" })
db.ads_spending_limit_logs.createIndex({ user_id: 1, timestamp: -1 }, { name: "spending_logs_user_timestamp_desc" })
db.ads_spending_limit_logs.createIndex({ createdAt: -1 }, { sparse: true, name: "spending_logs_createdAt_desc" })

// LIVE CHAT
db.live_chats.createIndex({ chatId: 1 }, { unique: true, name: "live_chats_chatId_unique" })
db.live_chats.createIndex({ userId: 1 }, { name: "live_chats_userId" })
db.live_chats.createIndex({ status: 1, updatedAt: -1 }, { name: "live_chats_status_updatedAt_desc" })

// LIVE CHAT MESSAGES
db.live_chat_messages.createIndex({ chatId: 1, createdAt: 1 }, { name: "live_chat_messages_chatId_createdAt_asc" })

// TICKETS
db.tickets.createIndex({ userId: 1, updatedAt: -1 }, { name: "tickets_userId_updatedAt_desc" })
db.tickets.createIndex({ updatedAt: -1 }, { name: "tickets_updatedAt_desc" })
db.tickets.createIndex({ createdAt: -1 }, { name: "tickets_createdAt_desc" })

// NOTIFICATIONS
db.notifications.createIndex({ status: 1, publishedAt: -1, createdAt: -1 }, { name: "notifications_status_published_created_desc" })
db.notifications.createIndex({ publishedAt: -1, createdAt: -1 }, { name: "notifications_published_created_desc" })

// USER HISTORY / ACTIVITY
db.otherCollection.createIndex({ userUid: 1, createdAt: -1 }, { name: "history_userUid_createdAt_desc" })
db.otherCollection.createIndex({ type: 1, createdAt: -1 }, { sparse: true, name: "history_type_createdAt_desc" })

// AFFILIATE
db.referral_history.createIndex({ referrerId: 1, createdAt: -1 }, { name: "referral_history_referrer_createdAt_desc" })
db.referral_withdraw_requests.createIndex({ userUid: 1, createdAt: -1 }, { sparse: true, name: "withdraw_requests_userUid_createdAt_desc" })
db.referral_withdraw_requests.createIndex({ createdAt: -1 }, { name: "withdraw_requests_createdAt_desc" })
db.referral_withdraw_requests.createIndex({ status: 1, createdAt: -1 }, { sparse: true, name: "withdraw_requests_status_createdAt_desc" })
db.payout_history.createIndex({ userId: 1, createdAt: -1 }, { name: "payout_history_userId_createdAt_desc" })
db.milestone_history.createIndex({ userId: 1, createdAt: -1 }, { sparse: true, name: "milestone_history_userId_createdAt_desc" })

// FREEPIK
db.freepik_subscriptions.createIndex({ userUid: 1, planId: 1 }, { name: "freepik_subscriptions_userUid_planId" })
db.freepik_subscriptions.createIndex({ userUid: 1, purchasedAt: -1 }, { name: "freepik_subscriptions_userUid_purchasedAt_desc" })
db.freepik_downloads.createIndex({ userUid: 1, createdAt: -1 }, { name: "freepik_downloads_userUid_createdAt_desc" })
db.freepik_downloads.createIndex({ resourceId: 1 }, { sparse: true, name: "freepik_downloads_resourceId" })

// TEAM MEMBERS
db.team_members.createIndex({ userId: 1 }, { unique: true, name: "team_members_userId_unique" })
db.team_members.createIndex({ username: 1 }, { unique: true, sparse: true, name: "team_members_username_unique" })
db.team_members.createIndex({ publicId: 1 }, { unique: true, sparse: true, name: "team_members_publicId_unique" })

// AD ACCOUNTS / CATALOG-LIKE DATA
db.ad_accounts.createIndex({ account_id: 1 }, { unique: true, sparse: true, name: "ad_accounts_account_id_unique" })
db.products.createIndex({ category: 1 }, { sparse: true, name: "products_category" })
