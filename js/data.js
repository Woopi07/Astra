/* ==========================================================
   ASTRA — content data
   Edit text, questions, links here. app.js renders it.
   ========================================================== */

/* ---------- Home: Balance the Entry rounds ---------- */
const BALANCE_ROUNDS = [
  {
    prompt: "Bought a laptop for ₱30,000 and paid in cash. Which credit balances the entry?",
    debit: [{ acct: "Equipment", amt: 30000 }],
    credit: [{ acct: "Cash", amt: null }],
    options: [25000, 30000, 35000],
    answer: 30000,
    note: "Equipment goes up (debit) and Cash goes down (credit) by the same ₱30,000."
  },
  {
    prompt: "Performed services worth ₱50,000. The client paid ₱20,000 in cash, and the rest is on account. How much is debited to Accounts Receivable?",
    debit: [{ acct: "Cash", amt: 20000 }, { acct: "Accounts Receivable", amt: null }],
    credit: [{ acct: "Service Revenue", amt: 50000 }],
    options: [20000, 30000, 50000],
    answer: 30000,
    note: "Total debits must equal the ₱50,000 revenue: ₱20,000 cash + ₱30,000 receivable."
  },
  {
    prompt: "Bought office supplies for ₱8,000, paid ₱5,000 in cash, and owe the balance. How much is credited to Accounts Payable?",
    debit: [{ acct: "Office Supplies", amt: 8000 }],
    credit: [{ acct: "Cash", amt: 5000 }, { acct: "Accounts Payable", amt: null }],
    options: [3000, 5000, 13000],
    answer: 3000,
    note: "Credits must total ₱8,000: ₱5,000 cash paid + ₱3,000 still owed."
  }
];

/* ---------- Home: Think critically ---------- */
const THINK_QUESTION = {
  tag: "Intellectual skills",
  title: "A company reports a sudden increase in expenses. What should you do first?",
  scenario: "You notice that recorded expenses are significantly higher than those of the previous month. Your supervisor asks you to investigate.",
  choices: [
    "Accept the figures as correct",
    "Review supporting documents and compare records",
    "Immediately reduce the expenses",
    "Ignore the difference"
  ],
  answer: 1,
  explain: "Critical thinking means examining evidence, comparing information, and identifying possible reasons before drawing conclusions."
};

/* ---------- Students: Five habits ---------- */
const HABITS = [
  {
    id: "apply",
    title: "Apply What You Learn",
    item: "Hands-On Gauntlets",
    desc: "Don't just watch tutorials or attend demonstrations. Practice using accounting tools and software on your own to develop familiarity and confidence."
  },
  {
    id: "process",
    title: "Understand the Process Behind the Technology",
    item: "Lens of Why",
    desc: "Learn why each accounting task is performed, not just how to perform it. Understanding the principles makes it easier to adapt to different accounting systems and software."
  },
  {
    id: "explore",
    title: "Explore Beyond the Classroom",
    item: "Explorer's Compass",
    desc: "Take advantage of internships, online courses, workshops, and hands-on projects to gain practical experience with accounting technologies."
  },
  {
    id: "monitor",
    title: "Build and Monitor Your Skills",
    item: "Skill Tracker",
    desc: "Keep track of the accounting tools, software, and tasks you have learned. Identify areas where you need more practice and set goals for improvement."
  },
  {
    id: "adapt",
    title: "Stay Curious and Adaptable",
    item: "Adapt Core",
    desc: "Technology constantly evolves, so remain open to learning new tools, exploring digital solutions, and adapting to changes in the accounting profession."
  }
];

/* ---------- Students: Case study quest (one challenge per habit) ---------- */
const CASE_STUDY = {
  company: "Bayanihan Bakeshop",
  intro: "You're the new accounting intern at Bayanihan Bakeshop, a growing neighborhood bakery that just moved its books to cloud accounting software. It's month-end, and the owner needs the December books closed. Clear all five challenges to collect the five habits every digital-ready accountant carries.",
  challenges: [
    {
      habit: 0,
      title: "First Day in the Software",
      scenario: "Your supervisor sends you a tutorial video, then asks you to record today's bread sales in the new system yourself: total sales of ₱18,000, of which ₱12,000 was paid in cash and the rest was on credit.",
      question: "How much should you enter as Accounts Receivable?",
      choices: ["₱6,000", "₱12,000", "₱18,000", "₱30,000"],
      answer: 0,
      explain: "₱18,000 − ₱12,000 cash = ₱6,000 on credit. Doing the entry yourself, not just watching the tutorial, is how you build real confidence with the tool."
    },
    {
      habit: 1,
      title: "The Auto-Generated Entry",
      scenario: "The bakeshop paid ₱24,000 on December 1 for a one-year insurance policy. The software's automatic rule recorded the whole ₱24,000 as Insurance Expense for December.",
      question: "Why is this a problem at December 31?",
      choices: [
        "It isn't. The software follows accounting rules automatically.",
        "Only one month (₱2,000) has expired, so ₱22,000 should still be Prepaid Insurance.",
        "Insurance should never be recorded as an expense.",
        "The full amount should be recorded as revenue."
      ],
      answer: 1,
      explain: "₱24,000 ÷ 12 = ₱2,000 per month. Knowing why the adjustment exists (matching expenses to the period) lets you catch what the software gets wrong."
    },
    {
      habit: 2,
      title: "A System You've Never Used",
      scenario: "The bakeshop's new supplier sends invoices from Xero, but your classes have only covered one accounting program. The owner asks if you can help reconcile with the supplier.",
      question: "What's your best move?",
      choices: [
        "Say it's impossible because it wasn't taught in class.",
        "Wait for the school to add Xero to the curriculum.",
        "Take a free online course or workshop and practice with a trial version.",
        "Ask the supplier to stop using Xero."
      ],
      answer: 2,
      explain: "Online courses, workshops, trial versions and internships are how you gain experience the classroom can't fully cover."
    },
    {
      habit: 3,
      title: "The Recurring Mistake",
      scenario: "Two weeks in, you're fast and accurate with journal entries, but your bank reconciliations keep coming back with errors.",
      question: "What should you do?",
      choices: [
        "Keep a log of the tasks you've mastered, flag bank reconciliation as a gap, and set a practice goal.",
        "Avoid bank reconciliations and let someone else do them.",
        "Focus only on journal entries since you're already good at them.",
        "Assume the errors will fix themselves with time."
      ],
      answer: 0,
      explain: "Tracking what you've learned and naming your weak spots turns random practice into steady improvement."
    },
    {
      habit: 4,
      title: "The New AI Tool",
      scenario: "The owner wants to try an AI app that reads receipts and categorizes expenses automatically. Some of the staff are nervous about it.",
      question: "How should you respond?",
      choices: [
        "Refuse to use it and keep doing everything manually.",
        "Trust every category it produces without checking.",
        "Explore how it works, test it, and review its output before relying on it.",
        "Wait until everyone else has learned it first."
      ],
      answer: 2,
      explain: "Staying curious means trying new tools early, while your professional judgment stays in charge of checking the results."
    }
  ]
};

/* ---------- Students: Side quests (Accounting Competency Mini-Games) ---------- */
const SIDE_QUESTS = [
  {
    id: "g1",
    title: "Spot the Error",
    focus: "Intellectual and Technical/Functional Competencies",
    objective: "Identify errors in financial records, calculations, and accounting documents.",
    instructions: "Analyze each accounting situation. Identify the error, determine its financial effect, or calculate the correct amount.",
    color: "yellow",
    items: [
      {
        title: "Unrecorded Accrued Expense",
        scenario: "At the end of December 2026, an accounting staff member discovered that the company had already consumed electricity amounting to ₱18,500. However, the bill would only be paid in January 2027. The accountant did not record the expense because no payment had been made.",
        question: "What is the likely effect of this omission on the December 2026 financial statements?",
        choices: [
          "Expenses and liabilities are understated, while net income and equity are overstated.",
          "Expenses and liabilities are overstated, while net income and equity are understated.",
          "Assets and expenses are understated, while liabilities are overstated.",
          "There is no effect because the electricity bill has not yet been paid."
        ],
        answer: 0,
        explain: "Under the accrual basis of accounting, expenses are recognized when incurred, not necessarily when paid. Since the electricity was already consumed in December, the company should recognize Electricity Expense and an Accrued Liability. Omitting the entry understates expenses and liabilities and consequently overstates net income and equity."
      },
      {
        title: "Incorrect Depreciation Computation",
        scenario: "A company acquired equipment on January 1, 2024, for ₱240,000. Its estimated residual value is ₱30,000, and its useful life is six years. The accountant reported accumulated depreciation of ₱90,000 as of December 31, 2026.",
        question: "Using the straight-line method, what should the accumulated depreciation be?",
        choices: ["₱70,000", "₱90,000", "₱105,000", "₱120,000"],
        answer: 2,
        explain: "Annual depreciation = (Cost − Residual Value) ÷ Useful Life = (₱240,000 − ₱30,000) ÷ 6 = ₱35,000 per year. From January 1, 2024, to December 31, 2026, three years have elapsed. Accumulated depreciation = ₱35,000 × 3 = ₱105,000. The reported ₱90,000 is understated by ₱15,000."
      },
      {
        title: "Incorrect Cost of Goods Sold",
        scenario: "A company reported the following inventory information for the year: Beginning inventory ₱80,000; Purchases ₱150,000; Purchase returns ₱10,000; Freight-in ₱5,000; Ending inventory ₱65,000. The accountant reported cost of goods sold of ₱175,000.",
        question: "What is the correct cost of goods sold?",
        choices: ["₱145,000", "₱150,000", "₱160,000", "₱175,000"],
        answer: 2,
        explain: "Net purchases = ₱150,000 − ₱10,000 + ₱5,000 = ₱145,000. Cost of Goods Sold = Beginning Inventory + Net Purchases − Ending Inventory = ₱80,000 + ₱145,000 − ₱65,000 = ₱160,000. The accountant overstated cost of goods sold by ₱15,000."
      },
      {
        title: "Incorrect Revenue Recognition",
        scenario: "On December 28, 2026, a company received ₱75,000 from a customer for services that will only be performed in January 2027. The accountant immediately recognized the entire amount as service revenue.",
        question: "Which accounting treatment should have been applied upon receipt?",
        choices: [
          "Debit Accounts Receivable and credit Service Revenue.",
          "Debit Service Revenue and credit Cash.",
          "Debit Cash and credit Unearned Revenue.",
          "Debit Cash and credit Retained Earnings."
        ],
        answer: 2,
        explain: "The company has received cash but has not yet performed the services. The amount is initially recognized as a liability rather than revenue. Revenue will be recognized when the company satisfies its performance obligation in January 2027."
      },
      {
        title: "Bank Reconciliation Error",
        scenario: "A company's bank statement shows a balance of ₱125,000. During reconciliation, the accountant identified a deposit in transit of ₱18,000, outstanding checks of ₱12,000, and a bank service charge not yet recorded in the books of ₱500.",
        question: "What is the adjusted bank balance?",
        choices: ["₱112,500", "₱131,000", "₱143,000", "₱130,500"],
        answer: 1,
        explain: "Adjusted bank balance = ₱125,000 + ₱18,000 − ₱12,000 = ₱131,000. The ₱500 bank service charge is deducted from the book balance because it has not yet been recorded in the company's records. It does not affect the adjusted bank balance."
      },
      {
        title: "Allowance for Doubtful Accounts",
        scenario: "A company has accounts receivable of ₱500,000. At year-end, the required ending balance of the Allowance for Doubtful Accounts is ₱25,000. Before adjustment, the account has an existing credit balance of ₱8,000.",
        question: "How much should the company recognize as bad debt expense?",
        choices: ["₱8,000", "₱17,000", "₱25,000", "₱33,000"],
        answer: 1,
        explain: "Required adjustment = ₱25,000 − ₱8,000 = ₱17,000. The company should recognize ₱17,000 as Bad Debt Expense and increase the allowance account by the same amount."
      },
      {
        title: "Prepaid Insurance Adjustment",
        scenario: "On October 1, 2026, a company paid ₱48,000 for a 12-month insurance policy and recorded the payment as Prepaid Insurance.",
        question: "How much insurance expense should be recognized by December 31, 2026?",
        choices: ["₱4,000", "₱12,000", "₱16,000", "₱48,000"],
        answer: 1,
        explain: "Monthly insurance expense = ₱48,000 ÷ 12 = ₱4,000. From October 1 to December 31, three months have expired: ₱4,000 × 3 = ₱12,000. The adjusting entry debits Insurance Expense and credits Prepaid Insurance for ₱12,000."
      },
      {
        title: "Improper Capitalization",
        scenario: "A company purchased machinery worth ₱300,000 that is expected to provide economic benefits for eight years. However, the accountant recorded the entire amount as Repairs and Maintenance Expense.",
        question: "Assuming the machinery meets the recognition criteria for property, plant, and equipment, what is the appropriate treatment?",
        choices: [
          "Recognize the entire amount as an expense because cash was paid.",
          "Capitalize the machinery as property, plant, and equipment and depreciate it over its useful life.",
          "Record the machinery as inventory.",
          "Recognize the amount as an intangible asset."
        ],
        answer: 1,
        explain: "Machinery that meets the recognition criteria for PPE should be recorded as an asset because it provides economic benefits over multiple periods. Expensing the entire purchase would overstate current-period expenses and understate assets."
      },
      {
        title: "Inventory Cut-Off Error",
        scenario: "A company purchased goods worth ₱40,000 under FOB Shipping Point terms. The seller shipped the goods on December 30, 2026, but they arrived at the buyer's warehouse on January 3, 2027. The buyer excluded the goods from its December 31, 2026 inventory because they had not physically arrived.",
        question: "What is the correct treatment?",
        choices: [
          "Include the goods in December 31 inventory because ownership generally transfers to the buyer upon shipment under FOB Shipping Point terms.",
          "Exclude the goods because inventory can only be recognized upon physical receipt.",
          "Recognize the goods as an expense in December.",
          "Recognize the goods as inventory only when payment is made."
        ],
        answer: 0,
        explain: "Under FOB Shipping Point terms, ownership and the associated risks generally transfer to the buyer when the seller ships the goods. Since they were shipped on December 30, the buyer should recognize them as inventory at December 31 even if they have not physically arrived."
      },
      {
        title: "Liquidity Ratio Error",
        scenario: "A company reported current assets of ₱600,000, inventory of ₱200,000, and current liabilities of ₱250,000. The accountant computed the quick ratio as 2.4:1 by dividing total current assets by current liabilities.",
        question: "What is the correct quick ratio?",
        choices: ["0.8:1", "1.6:1", "2.0:1", "2.4:1"],
        answer: 1,
        explain: "Inventory is excluded because it is generally less liquid. Quick Ratio = (₱600,000 − ₱200,000) ÷ ₱250,000 = ₱400,000 ÷ ₱250,000 = 1.6:1."
      }
    ]
  },
  {
    id: "g2",
    title: "What Would You Do?",
    focus: "Personal, Ethical, and Professional Judgment Competencies",
    objective: "Develop ethical judgment, decision-making, and professional responsibility.",
    instructions: "Read each workplace dilemma carefully. Some choices may appear reasonable, but only one best demonstrates professional judgment, integrity, and accountability.",
    color: "coral",
    items: [
      {
        title: "Pressure to Manipulate Expenses",
        scenario: "Your accounting manager asks you to postpone recording expenses already incurred before year-end so the company can report a higher net income and meet its financial targets.",
        question: "What should you do?",
        choices: [
          "Follow the instruction because the manager has authority over the accounting department.",
          "Refuse to misstate the financial records and explain that expenses must be recognized in the appropriate accounting period.",
          "Record only half of the expenses to compromise with the manager.",
          "Ignore the instruction but do not report the matter."
        ],
        answer: 1,
        explain: "Accountants must uphold integrity, objectivity, and professional behavior. Deliberately postponing expenses to inflate profit misrepresents financial performance and violates the accrual basis of accounting."
      },
      {
        title: "Accidental Disclosure of Confidential Information",
        scenario: "You accidentally uploaded a report containing employees' salaries and personal information to a shared folder accessible to unauthorized employees.",
        question: "What should be your first appropriate response?",
        choices: [
          "Delete the report and pretend the incident never happened.",
          "Wait until someone complains before taking action.",
          "Restrict access where possible and promptly report the incident through the organization's data privacy or information security procedures.",
          "Send a message to all employees explaining whose information was exposed."
        ],
        answer: 2,
        explain: "Personal information must be protected. Take immediate steps to limit further exposure and report the incident through established data privacy procedures. Concealing it may worsen the consequences."
      },
      {
        title: "Threat to Auditor Independence",
        scenario: "You are assigned to audit a company whose chief accountant is a close personal friend. You later discover that your friend was directly involved in preparing the financial statements you are expected to examine.",
        question: "What is the most appropriate action?",
        choices: [
          "Continue the audit because personal relationships do not affect professional judgment.",
          "Avoid examining your friend's work but do not disclose the relationship.",
          "Disclose the relationship and allow the appropriate authority to evaluate the threat and determine suitable safeguards or reassignment.",
          "Automatically issue an adverse opinion."
        ],
        answer: 2,
        explain: "A close relationship with someone who prepared the statements may create a familiarity or self-interest threat. It should be disclosed so safeguards, including reassignment when necessary, can be considered."
      },
      {
        title: "Suspicious Supplier Transactions",
        scenario: "During an internal review, you notice repeated payments to a supplier whose registered address appears to be the same as the address of an employee authorized to approve purchases. Several transactions also lack supporting documents.",
        question: "What should you do?",
        choices: [
          "Immediately accuse the employee of fraud.",
          "Ignore the transactions because they have already been approved.",
          "Document the unusual transactions, request supporting evidence, and escalate the matter through the proper reporting channels.",
          "Delete the transactions to prevent possible financial losses."
        ],
        answer: 2,
        explain: "Suspicious circumstances may indicate fraud or conflicts of interest, but they do not automatically prove wrongdoing. Gather evidence, document observations, and report through proper channels."
      },
      {
        title: "Incomplete Documentation Before a Deadline",
        scenario: "Your supervisor asks you to finalize a financial report within one hour. However, several transactions lack supporting documents, making it difficult to verify their accuracy.",
        question: "What is the best course of action?",
        choices: [
          "Submit the report without mentioning the missing documents.",
          "Invent reasonable explanations for the unsupported transactions.",
          "Communicate the limitations, prioritize the verification of material transactions, and avoid presenting unsupported information as verified.",
          "Refuse to work on the report entirely."
        ],
        answer: 2,
        explain: "Accountants should not knowingly present unsupported information as accurate. Communicating limitations and prioritizing material transactions shows competence, due care, and accountability."
      },
      {
        title: "Suspected Misappropriation by a Senior Manager",
        scenario: "While conducting an internal audit, you discover evidence suggesting that a senior manager may be diverting company funds for personal use. You are concerned that reporting the matter could result in retaliation.",
        question: "What should you do?",
        choices: [
          "Confront the senior manager publicly.",
          "Destroy the evidence to protect yourself.",
          "Preserve the relevant evidence and report the matter through authorized internal reporting and escalation channels while maintaining appropriate confidentiality.",
          "Discuss the matter with coworkers before deciding what to do."
        ],
        answer: 2,
        explain: "Preserve evidence, maintain confidentiality, and use established reporting procedures. Public confrontation or destroying evidence could compromise the investigation."
      },
      {
        title: "Incorrect AI-Generated Accounting Classification",
        scenario: "Your company uses an artificial intelligence system to classify transactions. While reviewing its output, you notice that several capital expenditures have been incorrectly classified as operating expenses.",
        question: "What should you do?",
        choices: [
          "Accept the AI-generated classifications because the system is designed for accounting purposes.",
          "Verify the classifications against the supporting documents and applicable accounting standards before approving the entries.",
          "Delete all AI-generated records.",
          "Ignore the errors if they do not significantly affect the current month's cash balance."
        ],
        answer: 1,
        explain: "AI can improve efficiency, but it does not remove the accountant's responsibility. Verify automated outputs against supporting documents and applicable standards."
      },
      {
        title: "Request to Prepare Misleading Financial Statements",
        scenario: "A client asks you to prepare two sets of financial statements: one showing the actual financial condition of the company and another showing inflated profits to attract potential investors.",
        question: "What is the most appropriate response?",
        choices: [
          "Prepare both sets but label the inflated one as confidential.",
          "Agree because the client is responsible for the information provided.",
          "Refuse to prepare misleading financial statements and explain the ethical and legal consequences of financial misrepresentation.",
          "Inflate only selected accounts to make the statements appear more realistic."
        ],
        answer: 2,
        explain: "Intentionally inflated statements mislead investors. Accountants must refuse to participate in misrepresentation and explain the ethical and legal consequences."
      },
      {
        title: "Personal Accounting Error",
        scenario: "After submitting a financial report, you discover that you accidentally recorded a transaction twice, resulting in expenses being overstated by ₱35,000.",
        question: "What should you do?",
        choices: [
          "Leave the error uncorrected because the report has already been submitted.",
          "Delete the duplicate entry without informing anyone.",
          "Promptly inform your supervisor, document the error, and follow the appropriate correction and reporting procedures.",
          "Wait until the next reporting period to see whether anyone notices."
        ],
        answer: 2,
        explain: "Take responsibility for errors, even after submission. Prompt reporting and proper correction keep financial information reliable."
      },
      {
        title: "Incomplete Payment Documentation",
        scenario: "A department head approves a ₱250,000 payment to an important supplier. However, the payment request does not include a purchase order or receiving documents. The department head insists that the payment must be processed immediately.",
        question: "What should you do?",
        choices: [
          "Process the payment because the department head has approved it.",
          "Process half of the payment while waiting for the documents.",
          "Follow the organization's authorization and documentation procedures and request the necessary supporting documents before processing the payment.",
          "Reject all future transactions with the supplier."
        ],
        answer: 2,
        explain: "Approval does not replace required documentation. Purchase orders and receiving documents establish that the transaction is authorized, valid, and supported."
      }
    ]
  },
  {
    id: "g3",
    title: "Explain It to Your Client",
    focus: "Interpersonal, Communication, and Client Relations Competencies",
    objective: "Improve communication skills by translating technical accounting concepts into understandable explanations.",
    instructions: "Imagine that you are a professional accountant explaining financial matters to a client who does not have an accounting background. Choose the response that is both technically accurate and easy to understand.",
    color: "mint",
    items: [
      {
        title: "Profitability vs. Liquidity",
        scenario: "A business owner tells you: \"Our company earned ₱500,000 in profit this year, but we are struggling to pay our suppliers. How can we be profitable but still have no cash?\"",
        question: "How would you best explain this?",
        choices: [
          "The company must have calculated its profit incorrectly.",
          "Profit does not necessarily mean cash is available. Some sales may be on credit, and funds may be tied up in inventory or receivables.",
          "The company should immediately stop recording credit sales.",
          "Profit and cash flow always move in the same direction."
        ],
        answer: 1,
        explain: "Profitability and liquidity measure different things. A company may report profit from credit sales before collecting cash, or have funds tied up in inventory or receivables."
      },
      {
        title: "Understanding a Qualified Audit Opinion",
        scenario: "A client receives an audit report containing a qualified opinion and becomes worried that the entire financial statements are fraudulent.",
        question: "How would you explain the opinion?",
        choices: [
          "A qualified opinion means the auditor found fraud in every major account.",
          "It generally means the financial statements are fairly presented except for a specific material matter, which is not pervasive to the financial statements as a whole.",
          "It means the auditor completely rejects the financial statements.",
          "It means the company has no accounting errors."
        ],
        answer: 1,
        explain: "A qualified opinion indicates fair presentation in all material respects except for a specific matter (or limitation) that is material but not pervasive. It does not mean the statements are fraudulent."
      },
      {
        title: "Income Tax Expense vs. Income Tax Payable",
        scenario: "A business owner asks why the income tax expense in the financial statements is different from the income tax payable reported for tax purposes.",
        question: "Which explanation is most appropriate?",
        choices: [
          "The difference always indicates that the accountant made an error.",
          "Accounting rules and tax rules may recognize income and expenses at different times or in different amounts. These differences may result in deferred tax assets or liabilities.",
          "Income tax expense and income tax payable should always be identical.",
          "Income tax payable is not related to the company's financial statements."
        ],
        answer: 1,
        explain: "Financial accounting and taxation follow different rules. Timing or amount differences can make tax expense differ from tax payable, creating deferred tax assets or liabilities."
      },
      {
        title: "Understanding Materiality",
        scenario: "A client asks why auditors focus on certain transactions instead of examining every small detail in the same way.",
        question: "How would you explain materiality?",
        choices: [
          "Auditors ignore all transactions below a fixed peso amount.",
          "Auditors focus on information that could reasonably influence users' decisions, although even small amounts may be significant because of their nature or circumstances.",
          "Materiality means auditors only examine transactions involving large cash payments.",
          "Auditors can disregard any error that does not affect cash."
        ],
        answer: 1,
        explain: "Materiality is about what could reasonably influence users' decisions. It isn't based solely on peso amounts; a small item can be material because of its nature."
      },
      {
        title: "Expected Credit Losses",
        scenario: "A client believes that a company should only recognize bad debt expense when a customer actually fails to pay.",
        question: "How would you explain the expected credit loss approach?",
        choices: [
          "A company should wait until a customer files for bankruptcy before recognizing credit losses.",
          "A company recognizes an allowance based on expected credit losses using reasonable and supportable information, rather than waiting for an actual default.",
          "All accounts receivable should automatically be written off at year-end.",
          "Expected credit losses are recognized only when management decides to do so."
        ],
        answer: 1,
        explain: "The expected credit loss approach considers possible losses before default, using reasonable and supportable historical, current, and forward-looking information."
      },
      {
        title: "Going Concern Assumption",
        scenario: "A business owner says the company continues to generate revenue, so there is no reason to worry about its ability to continue operating. However, it has significant unpaid obligations and recurring cash shortages.",
        question: "How would you explain the going concern concept?",
        choices: [
          "A company is automatically a going concern as long as it earns revenue.",
          "Going concern assumes that an entity can continue operating for the foreseeable future, but financial difficulties may create significant doubts about its ability to do so.",
          "Going concern only applies to newly established businesses.",
          "A company can only be considered a going concern if it has no liabilities."
        ],
        answer: 1,
        explain: "Going concern presumes continued operations for the foreseeable future. Recurring cash shortages and unpaid obligations may raise significant doubt, and revenue alone doesn't guarantee stability."
      },
      {
        title: "Importance of Segregation of Duties",
        scenario: "A small business owner asks why different employees should be assigned to receive cash, record transactions, and reconcile bank accounts.",
        question: "What is the best explanation?",
        choices: [
          "Separating responsibilities reduces the opportunity for errors or fraud to occur and remain undetected.",
          "It ensures that fraud can never happen.",
          "It allows employees to avoid being held responsible for mistakes.",
          "It eliminates the need for management supervision."
        ],
        answer: 0,
        explain: "Separating cash handling, recording, and reconciling prevents one person from controlling a whole process. It reduces risk but cannot eliminate it entirely."
      },
      {
        title: "Customer Advances",
        scenario: "A customer pays ₱120,000 in advance for services that the company will provide next month. The business owner wants to recognize the entire amount as revenue immediately.",
        question: "How would you explain the correct treatment?",
        choices: [
          "The amount is initially recognized as a contract liability or unearned revenue until the company satisfies its performance obligation.",
          "The amount must be recognized as revenue immediately because cash has been received.",
          "The amount should be recorded as an expense.",
          "The amount should be recorded directly as retained earnings."
        ],
        answer: 0,
        explain: "Receiving cash doesn't mean revenue is earned. Before the service is provided, the company recognizes a contract liability; revenue follows when the obligation is satisfied."
      },
      {
        title: "Interpreting the Current Ratio",
        scenario: "A client proudly tells you that the company has a current ratio of 3:1, which means the company is financially healthy.",
        question: "What would be the most appropriate explanation?",
        choices: [
          "A current ratio of 3:1 guarantees that the company can pay all its obligations.",
          "A high current ratio may indicate short-term liquidity, but the quality and convertibility of current assets, cash flows, industry conditions, and other factors must also be considered.",
          "A current ratio above 1:1 always means the company is profitable.",
          "The current ratio is not useful in evaluating liquidity."
        ],
        answer: 1,
        explain: "A 3:1 ratio may look favorable, but you also need to consider asset quality, how quickly receivables are collected, whether inventory sells, and overall cash flow."
      },
      {
        title: "Explaining Internal Control Weaknesses",
        scenario: "During an engagement, you observe inadequate inventory documentation, inconsistent physical counts, and weak monitoring procedures. The owner asks whether this means employees are stealing inventory.",
        question: "How should you respond?",
        choices: [
          "Confirm that employees are stealing because inventory records are incomplete.",
          "Explain that these weaknesses increase the risk of errors, losses, or fraud, and recommend stronger documentation, monitoring, and physical inventory procedures without making unsupported accusations.",
          "Tell the owner that the weaknesses are harmless if the company is profitable.",
          "Recommend immediately dismissing all inventory employees."
        ],
        answer: 1,
        explain: "Weak controls increase the possibility of errors, losses, and fraud, but don't by themselves prove theft. Communicate the risks objectively and recommend stronger procedures."
      }
    ]
  }
];

/* ---------- Resource Hub ---------- */
const HUB_TABS = [
  {
    id: "tutorials",
    label: "Tutorials",
    formula: '=TUTORIALS("QuickBooks", "Xero", "Sage", "SAP")',
    title: "Accounting Software Tutorials",
    desc: "Step-by-step guides on using accounting software such as QuickBooks, Xero, and other accounting systems.",
    links: [
      { tag: "QuickBooks", label: "QuickBooks Modern Reports Update (Aug 2026)", url: "https://www.youtube.com/watch?v=DbKEcdYLe9o&list=PL8LZsiw8a1zuaeY-Z8uY5Bjf6RC8Ghc-J", kind: "video" },
      { tag: "QuickBooks", label: "How to Create a QuickBooks Online Account", url: "https://www.youtube.com/watch?v=CeygDJhdKu4&list=PLZbP5Q0d081puZTIMDnI7VP1LoeAM5-N2", kind: "video" },
      { tag: "Xero", label: "The Basics: Xero Software's Organization Settings Explained", url: "https://www.youtube.com/watch?v=GluL4zLdLwY&list=PLZbP5Q0d081q2VByXEStXeDcpBOe3KyBI", kind: "video" },
      { tag: "Sage", label: "Sage Accounting Tutorial: Introduction", url: "https://www.youtube.com/watch?v=qrPuE7xEl7U&list=PLl48NMG4PlArb5ktR5yXpIw_tvu_8j-6D", kind: "video" },
      { tag: "SAP", label: "SAP Tutorial for Beginners: SAP ERP", url: "https://www.youtube.com/watch?v=Nfq3OC6B-CU&list=PLDDGZDKC4NEgAQWCP5dRaJwf_Vozn1RpL", kind: "video" }
    ]
  },
  {
    id: "exercises",
    label: "Spreadsheet Exercises",
    formula: '=EXERCISES("Excel", "Google Sheets")',
    title: "Spreadsheet Exercises",
    desc: "Practical activities involving Excel or Google Sheets, including financial formulas, automated computations, data organization, and financial report preparation.",
    links: [
      { tag: "Practice", label: "Excel Practice Sheets", url: "https://excelpracticesheets.com/", kind: "site" },
      { tag: "Practice", label: "Spreadsheet Center", url: "https://spreadsheetcenter.com/", kind: "site" }
    ]
  },
  {
    id: "videos",
    label: "Videos",
    formula: '=VIDEOS("Journal", "Ledger", "Statements")',
    title: "Video Demonstrations",
    desc: "Recorded lessons showing how to perform common accounting tasks, such as recording transactions, preparing journal entries, posting to ledgers, and generating financial statements using digital tools.",
    links: [
      { tag: "FS automation", label: "How to Automate Accounting Ledger, Trial Balance, Income Statement, Balance Sheet", url: "https://www.youtube.com/watch?v=pgBsyTKAwLw", kind: "video" },
      { tag: "Full accounting cycle", label: "Accounting Cycle (Sir Chua)", url: "https://www.youtube.com/playlist?list=PLvUbkBvnR-nTyQDpguwgbi669IoDQpwRW", kind: "video" }
    ]
  },
  {
    id: "cases",
    label: "Case Studies",
    formula: '=CASES("Bayanihan Bakeshop", "Side Quests")',
    title: "Digital Accounting Case Studies",
    desc: "Practical business scenarios that let students apply accounting concepts with accounting software and spreadsheet applications. Play them as games in the Students section.",
    links: [
      { tag: "Case study quest", label: "Bayanihan Bakeshop: Month-End Close", url: "#students", kind: "internal" },
      { tag: "Side quests", label: "Accounting Competency Mini-Games (30 activities)", url: "#sidequests", kind: "internal" }
    ]
  },
  {
    id: "templates",
    label: "Templates",
    formula: '=TEMPLATES("Journal", "Ledger", "TB", "Bank Rec", "FS")',
    title: "Excel and Google Sheets Template Library",
    desc: "Ready-to-use templates for general journals, general ledgers, trial balances, bank reconciliations, and financial statements.",
    links: [
      { tag: "Templates", label: "Pinoy Akawntant: Downloads", url: "https://pinoyakawntant.com/download/", kind: "site" },
      { tag: "Templates", label: "AliTools Express: Accounting Templates", url: "https://alitoolsexpress.com/accounts/templates/", kind: "site" }
    ]
  }
];

/* ---------- Educators: Seven approaches ---------- */
const APPROACHES = [
  {
    title: "Experiential, Software-Based Learning",
    summary: "Students gain practical accounting experience by working with software and reflecting on their learning outcomes. This is the Kolb cycle: experience, reflect, conceptualize, apply.",
    how: [
      "Incorporate graded, hands-on activities using spreadsheets or accounting software for every topic.",
      "Facilitate brief reflective exercises to help students understand how and why specific software functions are used.",
      "Provide additional exercises with different datasets to reinforce learning and promote independent application."
    ]
  },
  {
    title: "Simulation and Case-Based Learning",
    summary: "Students analyze simulated business cases and make decisions using industry-relevant tools and available data.",
    how: [
      "Assign teams to complete the monthly or annual accounting cycle of a simulated company, from journal entries to financial statement preparation.",
      "Incorporate realistic workplace challenges, such as tight deadlines, incomplete information, and client inquiries.",
      "Conduct a post-activity discussion to evaluate the team's decisions, professional judgments, and identified risks."
    ]
  },
  {
    title: "Blended and Flipped Learning",
    summary: "Students prepare for classroom discussions through advanced lessons and demonstrations, followed by guided practical exercises.",
    how: [
      "Provide preparatory video lessons or reading materials before each class session.",
      "Begin each session with a short assessment of students' understanding, followed by applied learning activities.",
      "Make learning materials available in downloadable or offline formats to accommodate students with limited internet access."
    ]
  },
  {
    title: "Collaborative Learning",
    summary: "Students collaborate in structured teams with assigned roles, using shared digital resources to complete tasks and present their findings.",
    how: [
      "Assign specific team roles, such as team leader, documenter, reviewer, and presenter, and rotate responsibilities across activities.",
      "Facilitate collaborative tasks using shared digital documents or workbooks to ensure transparency and accountability in individual contributions.",
      "Require teams to present their outputs through live or recorded presentations, followed by constructive peer evaluation."
    ]
  },
  {
    title: "Scaffolded Tool Progression",
    summary: "Introduce digital tools progressively throughout the program, ensuring that each course builds on previously acquired skills.",
    how: [
      "Introduce digital tools gradually by year level, starting with spreadsheets, followed by accounting software and data analytics.",
      "Teach basic software skills, such as navigating menus, using functions, and checking results, to help students adapt to new applications.",
      "Let students perform the same accounting task using at least two software programs, one local and one international."
    ]
  },
  {
    title: "Mentoring",
    summary: "Students develop practical skills through instructor demonstrations followed by guided exercises. This is the observational learning in Bandura's social cognitive theory.",
    how: [
      "Provide step-by-step demonstrations of accounting procedures, explaining each stage before students perform the tasks independently.",
      "Invite practicing CPAs and alumni to conduct seminars showcasing the practical use of digital tools in accounting.",
      "Assign peer facilitators to assist classmates during practical activities, providing additional guidance and support when needed."
    ]
  },
  {
    title: "Competency-Based Assessment",
    summary: "Assess students through realistic accounting tasks using a rubric to measure their progress.",
    how: [
      "Include short software-based activities in assessments aside from written exams.",
      "Use one rubric to assess students across the five IFAC competency areas.",
      "Provide written feedback and allow students to improve their performance."
    ]
  }
];

/* ---------- PLV Admins: Five policies ---------- */
const POLICIES = [
  {
    title: "Integrate Practical Technology Applications into Accounting Courses",
    desc: "Incorporate technology-based activities and practical exercises across accounting subjects to help students apply accounting concepts using relevant digital tools, software, and applications."
  },
  {
    title: "Strengthen Access to Accounting Software and Learning Resources",
    desc: "Allocate sufficient resources for accounting software, computer laboratory facilities, equipment maintenance, and faculty development to support effective technology-integrated instruction."
  },
  {
    title: "Promote Equitable Access to Digital Learning Resources",
    desc: "Ensure that all students have adequate access to computers, reliable internet connectivity, and essential accounting software through campus facilities, computer lending programs, or other accessible learning arrangements."
  },
  {
    title: "Conduct Regular Reviews and Updates of the Accounting Curriculum",
    desc: "Periodically evaluate and update the accounting curriculum to incorporate emerging technologies, evolving industry practices, and the digital competencies required in the accounting profession."
  },
  {
    title: "Establish Continuous Feedback Mechanisms",
    desc: "Conduct regular consultations and gather feedback from alumni and industry partners to identify gaps in students' technological competencies and ensure that accounting education remains responsive to current workplace demands."
  }
];

/* ---------- Ranks ---------- */
const RANKS = [
  { min: 0, name: "Intern" },
  { min: 100, name: "Bookkeeper" },
  { min: 300, name: "Staff Accountant" },
  { min: 550, name: "Senior Accountant" },
  { min: 800, name: "CPA-Ready" }
];

/* ---------- Home: Debit or Credit Rush ----------
   a: "D" = debit, "C" = credit. type is shown as a hint tag. */
const RUSH_ITEMS = [
  { t: "Cash increases", type: "Asset", a: "D" },
  { t: "Cash decreases", type: "Asset", a: "C" },
  { t: "Accounts Receivable increases", type: "Asset", a: "D" },
  { t: "A customer pays their receivable", type: "Accounts Receivable", a: "C" },
  { t: "Equipment is purchased", type: "Asset", a: "D" },
  { t: "Supplies are used up", type: "Supplies (asset)", a: "C" },
  { t: "Prepaid Insurance increases", type: "Asset", a: "D" },
  { t: "Inventory increases", type: "Asset", a: "D" },
  { t: "Inventory is sold", type: "Inventory (asset)", a: "C" },
  { t: "Accounts Payable increases", type: "Liability", a: "C" },
  { t: "Accounts Payable is paid", type: "Liability", a: "D" },
  { t: "Unearned Revenue increases", type: "Liability", a: "C" },
  { t: "Unearned Revenue is earned", type: "Unearned Revenue (liability)", a: "D" },
  { t: "Notes Payable increases", type: "Liability", a: "C" },
  { t: "A bank loan is repaid", type: "Notes Payable (liability)", a: "D" },
  { t: "Interest Payable increases", type: "Liability", a: "C" },
  { t: "Owner invests more capital", type: "Owner's Capital (equity)", a: "C" },
  { t: "Owner's Drawings increase", type: "Equity (contra)", a: "D" },
  { t: "Service Revenue is earned", type: "Revenue", a: "C" },
  { t: "Sales Revenue increases", type: "Revenue", a: "C" },
  { t: "Sales Returns increase", type: "Contra revenue", a: "D" },
  { t: "Rent Expense is incurred", type: "Expense", a: "D" },
  { t: "Salaries Expense is incurred", type: "Expense", a: "D" },
  { t: "Utilities Expense is incurred", type: "Expense", a: "D" },
  { t: "Depreciation Expense is recorded", type: "Expense", a: "D" },
  { t: "Accumulated Depreciation increases", type: "Contra asset", a: "C" },
  { t: "Allowance for Doubtful Accounts increases", type: "Contra asset", a: "C" },
  { t: "Bad Debt Expense is recognized", type: "Expense", a: "D" }
];
