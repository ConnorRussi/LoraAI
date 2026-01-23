const p1 = `Samuel Cook from Visa <notifications@smartrecruiters.com>
Mon, Nov 24, 4:09 PM
to me

​​​​​​​​​​
Hello Connor, 

Thank you for your interest in Visa! We have reviewed your application and would like to consider you for the ​Software Engineer, Intern - Summer 2026 Ashburn, VA role at Visa! The next step is for you to complete a technical assessment via CodeSignal. Here are a few things to keep in mind – please carefully review the instructions: 

To receive a verified score, it’s essential to follow these rules carefully. CodeSignal’s AI Proctor is highly sensitive and can detect even minor violations, which may lead to your score being unverified.

Tips to Avoid Being Flagged:

•        Using an additional monitor, screen, or device, briefly looking away from your screen, or copy-pasting from an external source.

•        Usage of AI tools

•        Using a photo or name that does not match your ID.

•        Camera and/or microphone turned off, blocked or not functioning properly

•        Not being alone in the room during the test – think roommate or pet.

•        Sharing the wrong screen or not the entire screen

•        Copying work from other sources

•        Coding outside the CodeSignal platform

ACCESSING THE ASSESSMENT:  

Click on the invitation link for "Go to the Pre-Screen."  
Once you’re logged in, you’ll have the option to familiarize yourself with the testing platform by clicking “Take Now” and navigating to “View Sample”.  
The scored assessment can be started by selecting “NEXT”.  

ABOUT VIRTUAL PROCTORING:  

Virtual proctoring requires granting full access to your desktop, camera and microphone. This test requires verification of your identification through review of your official unexpired photo I.D. like your driver’s license, passport or student I.D. 

THINGS TO CONSIDER:  

Please complete within 3 calendar days from receiving the link. The link will say you have 2 weeks to complete, we ask to complete in 3 calendar days to ensure moving forward in the process.
Codesignal link email may be delayed by 24 hours. If you have not received an email with your link after 24 hours of receiving this email, please reach out.
If you have completed this assessment with Visa or another company, we welcome you to share your highest score with us.
If you have exceeded the amount of attempts, and are experiencing a cool down, you must wait until the cool down period has completed.
If you are unable to share your score, and are in a cool down period, you must wait until the cool down period has completed.
Learn how the test IDE Functions - This is a great way to learn how to switch between coding languages.  
The CodeSignal platform supports 40+ programming languages.  
You must complete the test in one sitting.  
We’ve compiled some helpful tips from CodeSignal along with platform usage recommendations. 
Additional tips and resources.
Results are verified within three business days. 

Please note that we use SmartRecruiters for our application system; you will receive communications from the application, and occasionally the emails may go to spam. In addition, the recruiting team may text you, which you can opt out at any point. If you have any questions, please don’t hesitate to reach out directly to your recruiter. We will be in touch soon! 

Best, 

Samuel Cook 

Visa Early Careers Talent Acquisition 

Visa is committed to offering reasonable accommodations in our recruiting process for candidates with disabilities. If you need assistance or a reasonable accommodation due to a disability, please let us know by emailing your recruiter. Your recruiter will work with Visa’s Employee Relations team to evaluate your request.`;
const a1 = {
  job: "Software Engineer, Intern - Summer 2026 Ashburn, VA",
  company: "Visa",
  status: "Technical assessment"
};
const p2=
  `Visa <notification@smartrecruiters.com>
Mon, Nov 24, 10:52 AM
to me

​Hello Connor,

Thank you for your interest in launching your career at Visa! We are excited to review your application and will contact you shortly. In the meantime, check out this video on the incredible transformative work Visa has done over the past 60 years!

We look forward to connecting with you.

Best,

Visa’s Early Careers Recruiting Team

Visa is committed to offering reasonable accommodations in our recruiting process for candidates with disabilities. If you need assistance or a reasonable accommodation due to a disability, please let us know by emailing your recruiter. Your recruiter will work with Visa’s Employee Relations team to evaluate your request.

Access My Application
If you were not expecting this message you can report suspected suspicious activity to SmartRecruiters (contactsupport@smartrecruiters.com).
Please do not share or forward this email, as it pertains to your specific job application`;
const a2 = {
  job: "General Application",
  company: "Visa",
  status: "applied"
};  


const prompts = [p1, p2];
const answers = [a1, a2];
export { prompts, answers };