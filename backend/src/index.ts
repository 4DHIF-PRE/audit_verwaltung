import 'dotenv/config'

import { expressApp } from "./routing.js";



expressApp.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Listening at ${process.env.EXPRESS_PORT}`)
});