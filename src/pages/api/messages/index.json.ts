import edjsHTML from 'editorjs-html';
import type { APIRoute } from 'astro'
import { XataClient } from '../../../xata.ts';
// Generated with CLI
export function JSONConvertToHTML(JSONStringParameter : string) {
    const JSONString = JSON.stringify({
        blocks: JSON.parse(JSONStringParameter)
      });
    const edjsParser = edjsHTML();
    // Parse the JSON string to get an object (if it is not already parsed)
    const parsedJSON = JSON.parse(JSONString);
    const html = edjsParser.parse(parsedJSON);  // Pass the parsed object    
    return html.join("");
}
const xata = new XataClient({ apiKey: import.meta.env.XATA_API_KEY, branch: import.meta.env.XATA_BRANCH });

export async function GET() {
    try {
        const records = await xata.db.contact_msgs
            .select(["username", "email", "message", "status"])
            .getAll();

        return new Response(
            JSON.stringify(records),
        )
    } catch (error: any) {
        if (error.toString().includes("column [panelSlug]: is not unique"))
            return new Response(
                JSON.stringify("Please enter a different a Permalink/Slug"),
            )
        console.log(error);
    }
}

export const POST: APIRoute = async ({ request }) => {

    // const SiteData = await fetch("http://localhost:4321/api/siteData.json").then(
    const SiteData = await fetch("https://smm-admin-panel.vercel.app/api/siteData.json").then(
        (Response) => Response.json(),
    );
    
    const emailConfig = SiteData[0].emailAutoReplyContent;
    // console.log("In Message API Email Configuration- ",emailConfig);
    
    const allowedOrigins = ['http://localhost:4321', 'http://localhost:4322', 'https://smmpanels.net'];
    const origin = request.headers.get('origin');
    const headers = new Headers();

    if (allowedOrigins.includes(origin || "")) {
        headers.set('Access-Control-Allow-Origin', origin || "");
        headers.set('Access-Control-Allow-Methods', 'POST');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    const data = await request.formData();
    // console.log("received in API - ", data);

    if (!data) {
        //If Data is not sent correctly then return
        return new Response(
            JSON.stringify({
                message: "Missing required fields",
            }),
            { status: 400 }
        );
    }

    // Save the message to database
    const record = await xata.db.contact_msgs.create({
        username: data.get("contact_name")?.toString(),
        email: data.get("contact_email")?.toString(),
        message: data.get("contact_msg")?.toString(),
    });

    if (record.id) {
        const emailParams = {
            service_id: import.meta.env.PUBLIC_AUTORespond_SERVICE_ID,
            template_id: import.meta.env.PUBLIC_AUTORespond_TEMPLATE_ID,
            user_id: import.meta.env.PUBLIC_ForgotPass_PUBLICKEY,
            accessToken: import.meta.env.PUBLIC_ForgotPass_PRIVATEKEY,
            template_params: {
                from_name : emailConfig.emailFrom,
                Subject_Line : emailConfig.emailSubject,
                mail_Content : JSONConvertToHTML(JSON.stringify(emailConfig.emailContent)).replaceAll("{{to_name}}", data.get("contact_name")?.toString() || ""),
                to_email: data.get("contact_email")?.toString(),
            }
        };

        let respondMessage="";
        try {
            const emailJSresponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailParams),
            });
            console.log(emailJSresponse);

            if (emailJSresponse.ok) {
                console.log('SUCCESS!', emailJSresponse, emailJSresponse.status, emailJSresponse.text);
                respondMessage = "Message Saved into Database and Email is Sent."
            } else {
                const error = await emailJSresponse.json();
                console.log('FAILED...', error);
                respondMessage = "Message Saved into Database and Email is not Sent."
            }
        }
        catch (error) {
            console.log("Email JS error-", error);
        }

        return new Response(JSON.stringify({ message: respondMessage }),
            { headers, status: 200 }
        );
    }
    else
        return new Response(
            JSON.stringify({
                message: "Data saving Error!"
            }),
            { status: 300 }
        );
};

/* export const PUT: APIRoute = async ({ request }) => {
    
    const data = await request.formData();
    // const SiteData = await fetch("http://localhost:4321/api/siteData.json").then(
     const SiteData = await fetch("https://smm-admin-panel.vercel.app/api/siteData.json").then(
        (Response) => Response.json(),
    );
    
    const emailConfig = SiteData[0].emailAutoReplyContent;
    // console.log("In Message API Email Configuration- ",emailConfig);


    const emailParams = {
        service_id: import.meta.env.PUBLIC_AUTORespond_SERVICE_ID,
        template_id: import.meta.env.PUBLIC_AUTORespond_TEMPLATE_ID,
        user_id: import.meta.env.PUBLIC_ForgotPass_PUBLICKEY,
        accessToken: import.meta.env.PUBLIC_ForgotPass_PRIVATEKEY,
        template_params: {
            from_name : emailConfig.emailFrom,
            Subject_Line : emailConfig.emailSubject,
            mail_Content : JSONConvertToHTML(JSON.stringify(emailConfig.emailContent)).replaceAll("{{to_name}}", data.get("contact_name")?.toString() || ""),
            to_email: data.get("contact_email")?.toString(),
        }
    };

    let respondMessage="";
    try {
        const emailJSresponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailParams),
        });
        console.log(emailJSresponse);
        
        if (emailJSresponse.ok) {
            console.log('SUCCESS!', emailJSresponse, emailJSresponse.status, emailJSresponse.text);
            respondMessage = "Message Saved into Database and Email is Sent."
        } else {
            const error = await emailJSresponse.json();
            console.log('FAILED...', error);
            respondMessage = "Message Saved into Database and Email is not Sent."
        }
    } 
    catch (error) {
        console.log("Email JS error-", error);
    }

    return new Response(
        JSON.stringify({
            message: "Data saving Error!"
        }),
        { status: 300 }
    );
}
 */