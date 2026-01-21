import type { APIRoute } from 'astro';
import { XataClient } from "../../../xata";

const xata = new XataClient({ apiKey: import.meta.env.XATA_API_KEY, branch: import.meta.env.XATA_BRANCH });

export const POST: APIRoute = async ({ request }) => {

    try {
        const userData = await request.formData();

        const records = await xata.db.users.select(["username", "password"]).getAll();

        let foundUser;
        for (let i = 0; i < records.length; i++) {
            if(records[i].username == userData.get("username")?.toString())
                foundUser = records[i];
        }

        if (foundUser != null && foundUser.password == userData.get("password")?.toString()) {
            return new Response(JSON.stringify({
                message: "user found",
                userID: foundUser.id,
                status: 200,
            }))
        }
        else
            return new Response(JSON.stringify({
                message: "user not found",
                status: 304,
            }))
    } catch (error) {
        return new Response(JSON.stringify({
            message: "Login Failed",
            error: JSON.stringify(error),
            status: 500,
        }))
    }
    
}