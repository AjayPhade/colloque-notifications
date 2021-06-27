var admin = require("firebase-admin");
var nodemailer = require("nodemailer");
require("dotenv").config();

var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "colloqueteam@gmail.com",
        pass: process.env.PASS,
    },
});

var serviceAccount = require("E:\\Projects\\Web\\Hackathon\\colloque-3cba2-firebase-adminsdk-jswqw-94ed6aa93d.json");

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const firestore = app.firestore();

(async () => {
    let threadsRef = firestore.collection("threads");
    let threads = (await threadsRef.get()).docs;
    let facultyRef = firestore.collection("faculty");
    let faculty = (await facultyRef.get()).docs;

    for (let i = 0; i < faculty.length; i++) {
        let unansweredThreads = [];

        for (let j = 0; j < threads.length; j++) {
            // console.log(faculty[i].data().subjects);
            // console.log(threads[j].data().subject);
            // console.log(
            //     faculty[i].data().subjects.includes(threads[j].data().subject)
            // );

            // check if subject in thread is taught by faculty and there are no faculty replies to that thread
            var duration = new Date() - threads[j].data().timestamp.toDate();
            hours = Math.floor(duration / 3600000);
            // console.log(hours);

            if (
                faculty[i]
                    .data()
                    .subjects.includes(threads[j].data().subject) &&
                threads[j].data().facultyReplies.length === 0 &&
                hours > 48
            ) {
                let thread = threads[j].data();
                thread.id = threads[j].id;
                unansweredThreads.push([thread.query, thread.id]);
            }
        }

        // if there are some unsanswered threads then send the mail
        if (unansweredThreads.length) {
            console.log(unansweredThreads);
            let text = `Hello ${
                faculty[i].data().name
            },\nThere are some unanswered threads\n`;

            for (let j = 0; j < unansweredThreads.length; j++) {
                text +=
                    j +
                    1 +
                    ". " +
                    unansweredThreads[j][0] +
                    "\n" +
                    "http://localhost:3000/thread/" +
                    unansweredThreads[j][1] +
                    "\n";
            }

            text += "\nColloque Team";

            console.log(text);

            var mailOptions = {
                from: "colloqueteam@gmail.com",
                to: faculty[i].data().email,
                subject: "Colloque: Unanswered Queires",
                text: text,
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Email sent: " + info.response);
                }
            });
        }
    }
})();
