/**
 * CyberShield — Beta Tester Feedback Form builder
 * -------------------------------------------------
 * HOW TO RUN (one time, ~2 minutes):
 *   1. Go to https://script.google.com  ->  New project
 *   2. Delete the default code, paste this whole file in
 *   3. Click Run (▶). Approve the permission prompt the first time.
 *   4. Open the Execution log — it prints the live form URL + edit URL.
 *
 * Responses land in the form's "Responses" tab; click the Sheets icon
 * there to pipe them into a spreadsheet.
 */
function createCyberShieldFeedbackForm() {
  const form = FormApp.create('CyberShield — Beta Tester Feedback')
    .setDescription(
      'Thanks for testing CyberShield. Your honest feedback shapes what ships next — ' +
      'nothing is too small. This takes about 4–5 minutes. All questions are optional ' +
      'unless marked required.'
    )
    .setCollectEmail(false)          // set true if you want tester emails auto-captured
    .setProgressBar(true)
    .setAllowResponseEdits(true)
    .setConfirmationMessage('Feedback received — thank you. This directly helps us harden CyberShield before launch.');

  const scale5 = ['1', '2', '3', '4', '5'];

  // ── Section 1: About your use ────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('About your use')
    .setHelpText('Quick context so we can read your answers correctly.');

  form.addMultipleChoiceItem()
    .setTitle('Which device did you mostly test on?')
    .setChoiceValues(['Phone', 'Laptop / desktop', 'Tablet', 'A mix']);

  form.addMultipleChoiceItem()
    .setTitle('How often did you use CyberShield during the test?')
    .setChoiceValues(['Once', 'A few times', 'Most days', 'Daily']);

  // ── Section 2: Goalie chat quality ───────────────────────────
  form.addPageBreakItem()
    .setTitle('Goalie (the scam-help chat)')
    .setHelpText('If you did not use the chat, skip to the next section.');

  form.addMultipleChoiceItem()
    .setTitle('Did you use the Goalie chat?')
    .setChoiceValues(['Yes', 'No'])
    .setRequired(true);

  form.addScaleItem()
    .setTitle('The advice Goalie gave was accurate')
    .setBounds(1, 5).setLabels('Strongly disagree', 'Strongly agree');

  form.addScaleItem()
    .setTitle('Goalie’s answers were clear and easy to understand')
    .setBounds(1, 5).setLabels('Strongly disagree', 'Strongly agree');

  form.addScaleItem()
    .setTitle('Goalie’s answers were genuinely helpful')
    .setBounds(1, 5).setLabels('Strongly disagree', 'Strongly agree');

  form.addMultipleChoiceItem()
    .setTitle('How did the response speed feel?')
    .setChoiceValues(['Too slow', 'A little slow', 'Just right', 'Fast']);

  form.addScaleItem()
    .setTitle('The tone felt right — professional and reassuring, not alarming')
    .setBounds(1, 5).setLabels('Strongly disagree', 'Strongly agree');

  form.addParagraphTextItem()
    .setTitle('Did Goalie ever give advice that was wrong, confusing, or off? Tell us what happened.');

  // ── Section 3: Bugs & errors ─────────────────────────────────
  form.addPageBreakItem()
    .setTitle('Bugs & errors')
    .setHelpText('Anything that broke, glitched, or threw an error.');

  form.addMultipleChoiceItem()
    .setTitle('Did you run into any bugs or errors?')
    .setChoiceValues(['Yes', 'No'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('Where did it happen? (check all that apply)')
    .setChoiceValues([
      'Goalie chat',
      'Community scam wall',
      'Signing in / account',
      'Loading / performance',
      'Something looked broken on screen',
      'Other'
    ]);

  form.addParagraphTextItem()
    .setTitle('Describe the bug — what did you do, and what went wrong?')
    .setHelpText('Steps to reproduce, error messages, or a screenshot link all help.');

  form.addScaleItem()
    .setTitle('How much did the issue get in your way?')
    .setBounds(1, 5).setLabels('Minor annoyance', 'Blocked me completely');

  // ── Section 4: Trust & safety ────────────────────────────────
  form.addPageBreakItem()
    .setTitle('Trust & safety')
    .setHelpText('CyberShield only works if it feels safe and credible.');

  form.addScaleItem()
    .setTitle('I felt safe sharing a scam or personal situation')
    .setBounds(1, 5).setLabels('Not at all', 'Completely');

  form.addScaleItem()
    .setTitle('The community scam wall felt credible and trustworthy')
    .setBounds(1, 5).setLabels('Not at all', 'Completely');

  form.addScaleItem()
    .setTitle('I would trust CyberShield’s guidance during a real scam')
    .setBounds(1, 5).setLabels('Not at all', 'Completely');

  form.addParagraphTextItem()
    .setTitle('Was there anything that made you hesitant or uneasy?');

  // ── Section 5: Overall & NPS ─────────────────────────────────
  form.addPageBreakItem()
    .setTitle('Overall impression');

  form.addScaleItem()
    .setTitle('Overall, CyberShield was easy to use')
    .setBounds(1, 5).setLabels('Strongly disagree', 'Strongly agree');

  form.addScaleItem()
    .setTitle('How likely are you to recommend CyberShield to a friend or family member?')
    .setBounds(0, 10).setLabels('Not at all likely', 'Extremely likely')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('What did you like most?');

  form.addParagraphTextItem()
    .setTitle('If you could change one thing, what would it be?');

  form.addParagraphTextItem()
    .setTitle('Anything else you want us to know?');

  form.addTextItem()
    .setTitle('Okay for us to follow up? Drop your email (optional).');

  // ── Output the URLs ──────────────────────────────────────────
  Logger.log('LIVE (share this):  %s', form.getPublishedUrl());
  Logger.log('EDIT (yours only):  %s', form.getEditUrl());
}
