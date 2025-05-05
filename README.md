
# Current backend restricitons

- no HTTPS (plain text cookies)
- no password/email change available due to the lack of alternative authentication (Combined with notification send)
- no notifications (Working on)
- registration-tokens which expire before being consumed will remain in the database if they are not manually deleted (currently no deletion event scheduled)
- changing the IDs of existing roles can result in undefined/unwwanted behaviour
