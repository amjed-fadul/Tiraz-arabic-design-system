import type { ComponentId } from "./catalog";
import type { Localized } from "./i18n";

/**
 * The notes row under a page's example. `instead` names another page where
 * one fits better; the frame links it by that page's name. A pattern page
 * lists the part pages it `replaces` in that column instead (Docs §7).
 */
export interface PageNotes {
  useWhen: readonly Localized[];
  instead?: readonly { text: Localized; page?: ComponentId }[];
  replaces?: readonly ComponentId[];
  notice?: readonly Localized[];
}

/*
 * Every page in the navigation has all three columns, written from the side
 * of the person using the component. An `instead` text ends on a lead-in such
 * as "so use", and the frame puts the linked page's name right after it.
 * Arabic first, English saying the same. A Latin name in an Arabic sentence
 * never starts with a symbol such as "#", which the bidi algorithm would
 * strand on the wrong side.
 */
// A page without notes shows no notes row; Field opens Input and has none.
export const docsNotes: Partial<Record<ComponentId, PageNotes>> = {
  // AI patterns
  "task-starter": {
    useWhen: [
      [
        "يبدأ المستخدم عملًا مع المساعد من صفحة رئيسية أو لوحة جانبية أو حالة فارغة لصفحة.",
        "Someone starts work with the assistant from a home screen, a side panel or a page's empty state.",
      ],
      [
        "يحتاج الطلب إلى سجلات بعينها، كفاتورة أو عميل أو تقرير، فيرفقها المستخدم أو يستدعيها بـ @.",
        "The request needs particular records, such as an invoice, a customer or a report, which the person attaches or calls up with @.",
      ],
    ],
    replaces: [
      "prompt-bar",
      "chat-composer",
      "model-selector",
      "context-meter",
    ],
    notice: [
      [
        "يفتح الحرف @ قائمة بسجلاتك وتضيق بما يُكتب بعده. يبقى التركيز في الحقل، ويختار Enter السجل ويغلق Escape القائمة دون أن يغلق الصفحة.",
        "@ opens a list of your records that narrows as you type after it. Focus stays in the text area; Enter chooses a record and Escape closes the list, not the page.",
      ],
      [
        "لا يختار الإدخال بمحرر (IME) سجلًّا ولا يرسل ولا يحرّك القائمة أثناء الكتابة به.",
        "An input method (IME) never chooses, sends or moves the list while it is composing.",
      ],
      [
        "يقرّر تطبيقك المسودة والسجلات المرفقة والوضع. تبقى الاقتراحات ظاهرة أثناء الكتابة وتتعطّل أثناء الإرسال، ولا يزيل Backspace في حقل فارغ سجلًّا مرفقًا.",
        "Your app owns the draft, the attached records and the mode. Suggestions stay while you type and are disabled while sending, and Backspace in an empty field never removes an attached record.",
      ],
    ],
  },
  "cited-answer": {
    useWhen: [
      [
        "تعتمد الإجابة على بيانات المستخدم أو مستنداته أو أدواته المتصلة، ويريد الناس التحقق من المصادر قبل أن يتصرفوا.",
        "The answer draws on the user's data, documents or connected tools, and people need to check the sources before they act.",
      ],
      [
        "تريد أن ترى بنفسك ما بحث فيه المساعد قبل أن يكتب.",
        "People want to see what the assistant searched before it wrote.",
      ],
    ],
    replaces: [
      "thinking-indicator",
      "thinking-state",
      "streaming-text",
      "sources",
      "markdown",
    ],
    notice: [
      [
        "يقرّر تطبيقك الحالة والنص. يعلن النمط كل حالة بجملة واحدة، ولا يعلن الإجابة نفسها ولا الوقت المنقضي.",
        "Your app owns the status and the text. The pattern announces each status in one sentence, and never the answer itself or the elapsed time.",
      ],
      [
        "كل [n] في الإجابة رقم استشهاد: مرّر عليه أو ركّز لترى المصدر، ويفتحه Enter أو النقر، ويغلق Escape المعاينة.",
        "Each [n] in the answer is a citation number: hover or focus it to see the source, Enter or click opens it, and Escape closes the preview.",
      ],
      [
        "تمرّ روابط الإجابة عبر sourceHref، فلا تفتح إلا وجهات http وhttps والنسبية.",
        "Links in the answer pass through sourceHref, so they open only http, https and relative destinations.",
      ],
    ],
  },
  "data-answer": {
    useWhen: [
      [
        "تكون الإجابة رقمًا أو مقارنة أو اتجاهًا في بيانات المستخدم نفسها، ويكفيها رسم وجملتان.",
        "The answer is a figure, a comparison or a trend in the person's own data, and a chart and two sentences will do.",
      ],
      [
        "يريد المستخدم أن يعرف من أين جاء الرقم: أي فترة وأي تصفية وأي جداول.",
        "People want to know where the number came from: which period, which filters and which tables.",
      ],
    ],
    instead: [
      {
        text: [
          "تأتي الإجابة من مستندات لا من أرقام، فاستخدم",
          "The answer comes from documents rather than figures, so use",
        ],
        page: "cited-answer",
      },
    ],
    notice: [
      [
        "يقرّر تطبيقك الحالة والرسم وكل رقم، ولا يجلب النمط بيانات ولا يحسب شيئًا. ويعلن كل حالة مرة واحدة في جملة، ولا يعلن الأرقام.",
        "Your app owns the status, the chart and every figure; the pattern never fetches or computes anything. Each status is announced once, in one sentence, and the figures never are.",
      ],
      [
        "اختيار نوع الرسم يستدعي onChartTypeChange فقط، ويبقى الرسم كما هو حتى يمرّر تطبيقك رسمًا جديدًا. اعرض الأنواع التي تناسب البيانات وحدها.",
        "Choosing a chart type only calls onChartTypeChange, and the chart stays until your app passes a new one. Offer only the types that fit the data.",
      ],
      [
        "تبقى «كيف حُسب هذا؟» مطويّة حتى يفتحها المستخدم، وينسخ زر النسخ الشرح ومعه الفترة والتصفية والجداول مرقَّمة.",
        "How it was calculated stays folded until opened, and Copy takes the explanation with the range, the filters and the numbered tables.",
      ],
    ],
  },
  "change-summary": {
    useWhen: [
      [
        "يريد مدير أن يعرف ما الذي تحرّك هذا الأسبوع، ولماذا تحرّك، وما الذي يفعله بعد ذلك.",
        "A manager wants to know what moved this week, why it moved, and what to do about it.",
      ],
      [
        "تأتي الأرقام من عدة تقارير، ويحدّد تطبيقك أيّها جيّد وأيّها سيّئ.",
        "The numbers come from several reports, and your app decides which are good and which are bad.",
      ],
    ],
    replaces: ["insight-cards"],
    notice: [
      [
        "يبيّن السهم الاتجاه ويبيّن اللون المعنى، فارتفاع الفواتير المتأخرة أحمر. ولا تُكتب إشارة + أو − بجانب الأرقام.",
        "The arrow shows the direction and the color shows the meaning, so more late invoices is red. No + or − sign sits beside the figures.",
      ],
      [
        "يعلن النمط كل حالة مرة واحدة. وتظهر الإجراءات مع الملخص الجاهز فقط، فلا تُقترح خطوة على أرقام قد تكون قديمة.",
        "Each status is announced once. Actions show with a ready summary only, so no step is suggested from numbers that may be old.",
      ],
      [
        "تجري الخطوط الصغيرة من اليسار إلى اليمين في الاتجاهين، كما تفعل رسوم Tiraz.",
        "The sparklines run left to right in both directions, as Tiraz charts do.",
      ],
    ],
  },
  "agent-task": {
    useWhen: [
      [
        "ينفّذ الوكيل عملًا من عدة خطوات واستدعاءات أدوات، وقد يحتاج إلى موافقة في أثنائه.",
        "An agent runs work with several steps and tool calls, and may need an approval along the way.",
      ],
      [
        "يطول العمل حتى يريد المستخدم أن يوجّهه أو يوقفه دون أن يبدأ من جديد.",
        "The work runs long enough that people may want to steer or stop it without starting over.",
      ],
    ],
    replaces: ["task-rows", "tool-call", "tool-chips", "loading-state"],
    notice: [
      [
        "يقرّر تطبيقك الحالة والخطوات والوقت، ولا يبلّغه النمط إلا بما يطلبه المستخدم: البدء والتوجيه والإيقاف والقرار.",
        "Your app owns the status, the steps and the time; the pattern only reports what the person asks for: start, steer, stop and decide.",
      ],
      [
        "تُعلن كل حالة مرة واحدة في جملة، ولا يُعلن الوقت المنقضي أبدًا.",
        "Each status is announced once, in one sentence; the elapsed time never is.",
      ],
      [
        "يوجّه Enter الوكيل مع الخطوة التالية، وCtrl أو Cmd+Enter فورًا. والطلب المدمج يرفضه Escape، ولا اختصار لموافقة لا يمكن التراجع عنها.",
        "Enter steers at the next step and Ctrl or Cmd+Enter steers now. Escape rejects the inline request, and an approval that can't be undone has no shortcut.",
      ],
    ],
  },
  "suggested-edits": {
    useWhen: [
      [
        "يعيد المساعد صياغة جزء من نص المستخدم: يجعله أقصر أو أوضح أو أكثر رسمية، أو يترجمه.",
        "The assistant rewrites part of a person's text: shorter, clearer, more formal, or translated.",
      ],
      [
        "يريد المستخدم أن يرى كل تعديل ويقرّر فيه قبل أن يتغيّر نصه.",
        "People want to see each change and decide on it before their text changes.",
      ],
    ],
    replaces: ["selection-actions"],
    notice: [
      [
        "يبقى نص تطبيقك كما هو حتى «تطبيق»، ثم يسلّمه onApply النص المقبول وموضعه ليستبدله بنفسه. وإذا امتد التحديد عبر تنسيق يُطبَّق كنص عادي، وتقول البطاقة ذلك.",
        "Your app's text stays as it is until Apply; onApply then hands it the accepted text and its range to replace. A selection that spans formatting is applied as plain text, and the card says so.",
      ],
      [
        "يقبل Y التعديل الذي عليه التركيز ويرفضه N، على أي تخطيط للوحة المفاتيح، ولا يعملان مع Ctrl أو Cmd. ويغلق Escape الاقتراح ويعيد التركيز إلى النص.",
        "Y accepts the focused change and N rejects it, on any keyboard layout, never with Ctrl or Cmd. Escape dismisses the suggestion and returns focus to the text.",
      ],
      [
        "إذا غيّر المساعد كل كلمة تقريبًا فاعرض النسخة الجديدة بجانب القديمة، فالتعديلات المتعقَّبة تصعب قراءتها حينها.",
        "When the assistant changes almost every word, show the new version beside the old one: tracked changes are hard to read by then.",
      ],
    ],
  },
  "image-generation": {
    useWhen: [
      [
        "يصف المستخدم الصورة التي يريدها بكلماته، وتُنتج منها عدة نسخ ليختار بينها.",
        "A person describes the image they want in words, and you make several versions for them to choose between.",
      ],
      [
        "يستغرق التوليد وقتًا يكفي ليحتاج المستخدم إلى أن يرى أنه يتقدّم.",
        "The generation takes long enough that people need to see it moving.",
      ],
    ],
    replaces: ["image-result"],
    notice: [
      [
        "يقرّر تطبيقك الحالة والنسبة والصور. تتبع اللوحة النسبة التي تعلنها، أو يعبر مكّوك واحد الصفوف حتى تصل الصورة. ويعلن النمط كل حالة مرة واحدة، ولا يعلن النسبة ولا الوقت.",
        "Your app owns the status, the progress and the images. The canvas follows the progress you report, or one shuttle crosses the rows until the picture arrives. The pattern announces each status once, never the progress or the time.",
      ],
      [
        "تبقى النسخ والإجراءات معطّلة حتى تكتمل الصورة. ومع الحركة المخفَّضة لا تدور أي حلقة: يظهر خيط ساكن ثم تظهر الصورة كاملة تدريجيًا.",
        "The versions and actions stay inert until the image is done. With reduced motion nothing loops: a still thread shows, then the picture fades in whole.",
      ],
      [
        "قد ترفض سياسة منتجك بعض الطلبات: مرّر blocked مع سببه ليظهر نصًّا ثابتًا بجانب «تعديل بالوصف». ولا يُعدّ ذلك فشلًا.",
        "Your product's policy may refuse some requests: pass blocked with its reason, shown as persistent text beside Edit with a description. That is not a failure.",
      ],
    ],
  },
  terminal: {
    useWhen: [
      [
        "يريد المستخدم أن يتحقق مما فعله الوكيل: أي أمر شُغّل وماذا ظهر في مخرجاته.",
        "Someone wants to check what an agent did: which command ran and what it printed.",
      ],
      [
        "تعرض سجل بناء أو اختبار أو تثبيت ليقرأه المستخدم وينسخه.",
        "You show a build, test or install log for people to read and copy.",
      ],
    ],
    instead: [
      {
        text: [
          "تعرض كودًا مصدريًا لا مخرجات أمر، فاستخدم",
          "You are showing source code, not command output, so use",
        ],
        page: "code-block",
      },
      {
        text: [
          "تريد عرض عملية واحدة بحالتها وتفاصيلها، فاستخدم",
          "You want to show one operation with its status and details, so use",
        ],
        page: "tool-call",
      },
    ],
    notice: [
      [
        "يبقى النص باتجاه LTR بمسافاته كما هي حتى في الواجهة العربية، وينسخ الزر الأمر ثم سطرًا جديدًا ثم المخرجات.",
        "The text stays left-to-right with its spacing intact, even in an Arabic interface. Copy gives the command, a new line, then the output.",
      ],
      [
        "عند تفعيل followOutput تُتابَع المخرجات الجديدة ما دام المستخدم قرب النهاية، وتتوقف المتابعة إن حدّد نصًا.",
        "With followOutput on, new output scrolls into view while the reader is near the end, and it pauses when they select text.",
      ],
    ],
  },
  "chat-app": {
    useWhen: [
      [
        "تعرض محادثة يجمع فيها المساعد أكثر من نمط، كإجابة موثّقة ومهمة وأسئلة وطلب موافقة، مع قائمة محادثات للتنقّل بينها.",
        "You show a conversation where the assistant mixes patterns, such as a cited answer, a task, questions and an approval, with a list to move between conversations.",
      ],
      [
        "تحتاج لوحة جانبية بجوار المحادثة، لأدلة أو مسودة أو تفاصيل مهمة.",
        "You need a panel beside the conversation, for evidence, a draft or a task's details.",
      ],
      [
        "تريد أن تتحوّل قائمة المحادثات إلى لوحة جانبية على الجوال دون عمل إضافي منك.",
        "You want the conversation list to become a side sheet on phones without extra work.",
      ],
    ],
    instead: [
      {
        text: [
          "تكفي محادثة واحدة بلا قائمة تنقّل، فاستخدم",
          "One conversation is enough and needs no list, so use",
        ],
        page: "chat-thread",
      },
      {
        text: [
          "تحتاج قائمة التنقّل وحدها، فاستخدم",
          "You only need the navigation list, so use",
        ],
        page: "sidebar",
      },
    ],
    notice: [
      [
        "حين يبدّل المستخدم المحادثة، ألغِ أي رد ما زال يصل حتى لا يظهر في محادثة أخرى.",
        "When someone switches conversations, cancel any reply that is still arriving so it never lands in another one.",
      ],
      [
        "على الجوال يُغلق اختيار محادثة أو إنشاؤها اللوحة، ويعود التركيز إلى زر فتحها.",
        "On a phone, choosing or creating a conversation closes the sheet and returns focus to the button that opened it.",
      ],
      [
        "القائمة لا تحذف ولا تعيد التسمية بنفسها: كل من «إعادة التسمية» و«حذف» يستدعي دالتك فقط، ويتولّى تطبيقك حقل الاسم والتأكيد.",
        "The list never renames or deletes: Rename and Delete only call your functions, and your app owns the name field and the confirmation.",
      ],
      [
        "تنزل اللوحة الجانبية تحت المحادثة حين يقلّ عرض المساحة عن 960px، وتتمرّر وحدها.",
        "The side panel moves under the conversation when the space is narrower than 960px, and scrolls on its own.",
      ],
    ],
  },
  "ask-user-questions": {
    useWhen: [
      [
        "يحتاج الوكيل إلى إجابة قبل أن يكمل، مثل أي حساب يستخدم أو أي صيغة يفضّلها المستخدم.",
        "An agent needs an answer before it can continue, such as which account to use or which format a person prefers.",
      ],
      [
        "تجمع عدة أسئلة قصيرة وتُرسل إجاباتها معًا بدل أن تسأل واحدًا بعد آخر.",
        "You gather several short questions and send the answers together instead of asking one at a time.",
      ],
    ],
    instead: [
      {
        text: [
          "يتعلق الأمر بقرار واحد بين موافقة ورفض، فاستخدم",
          "It comes down to one decision, approve or reject, so use",
        ],
        page: "approval-card",
      },
      {
        text: [
          "السؤال حقل واحد في نموذج عادي، فاستخدم",
          "It is a single question inside an ordinary form, so use",
        ],
        page: "radio-group",
      },
    ],
    notice: [
      [
        "تختار مفاتيح ١ إلى ٩ الخيار المطابق، وتعمل الأرقام العربية واللاتينية معًا.",
        "Keys 1 to 9 pick the matching choice, and Arabic and Latin digits both work.",
      ],
      [
        "إن فشل الإرسال بقيت الإجابات كما كُتبت، ولا تأخذ البطاقة التركيز حين تظهر.",
        "If sending fails, the answers stay as typed. The card never takes focus when it appears.",
      ],
      [
        "مع receipt تُطوى الإجابات التي قبلها تطبيقك في «إجاباتك»، ومع onEditAnswers يظهر زر لتعديلها.",
        "With receipt, the answers your app accepted fold into “Your answers”, and onEditAnswers adds a button to edit them.",
      ],
    ],
  },
  "approval-card": {
    useWhen: [
      [
        "يوشك الوكيل على إجراء مؤثر، كحذف ملفات أو إرسال بريد، ويجب أن يوافق المستخدم أولًا.",
        "An agent is about to do something that matters, such as deleting files or sending an email, and the person must agree first.",
      ],
      [
        "تريد أن يرى المستخدم ما الذي سيحدث تمامًا قبل أن يقرّر.",
        "You want people to see exactly what will happen before they decide.",
      ],
    ],
    instead: [
      {
        text: [
          "تحتاج عدة قرارات متتابعة، فاستخدم",
          "You need several decisions in a row, so use",
        ],
        page: "approval-flow",
      },
      {
        text: [
          "يجب أن يحجب القرار بقية الصفحة حتى يُتخذ، فاستخدم",
          "The decision must block the rest of the page until it is made, so use",
        ],
        page: "modal",
      },
    ],
    notice: [
      [
        "تسجيل الموافقة لا يعني أن الإجراء نُفِّذ. يتحقق تطبيقك من الطلب وينفّذه بنفسه.",
        "Recording an approval does not mean the action ran. Your app checks the request and runs it itself.",
      ],
      [
        "يرفض Escape الطلب من داخل البطاقة، أما داخل نافذة فيغلقها ولا يسجّل شيئًا. ولا يوافق Ctrl أو Cmd+Enter إلا على طلب يعلّمه تطبيقك reversible، فلا اختصار لإجراء لا يمكن التراجع عنه.",
        "Escape inside the card rejects the request; inside a dialog it closes the dialog and records nothing. Ctrl or Cmd+Enter approves only a request your app marks reversible, so an action that can't be undone has no shortcut.",
      ],
      [
        "تنهي مهلة الطلب حين يمرّر تطبيقك expired، فيُلغى أي قرار ما زال قيد التسجيل.",
        "The request lapses when your app passes expired, and a decision still being recorded is cancelled.",
      ],
    ],
  },
  "decision-inbox": {
    useWhen: [
      [
        "يعمل عدة وكلاء في الخلفية، وتريد أن يجد المستخدم كل ما ينتظر قراره في مكان واحد.",
        "Several agents work in the background, and people should find everything that waits on them in one place.",
      ],
      [
        "تريد أن تُعرض الطلبات والأسئلة والمهام المتعثّرة بحسب إلحاحها، ويفتح المستخدم كلًّا منها في مكانه.",
        "You want requests, questions and failed tasks listed by urgency, each opening where it is.",
      ],
    ],
    instead: [
      {
        text: ["يكفي طلب واحد، فاستخدم", "There is a single request, so use"],
        page: "approval-card",
      },
    ],
    notice: [
      [
        "لا موافقة على الكل: كل قرار يخصّ طلبًا بعينه. ولا يقرّر الصف دون أن يُفتح إلا إذا علّم تطبيقك الطلب reversible، وبلا اختصار، ولا يضع فتحُ الصف التركيزَ على الموافقة.",
        "There is no approve-all: every decision is about one request. A row decides without opening only when your app marks the request reversible, with no shortcut, and opening a row never puts focus on Approve.",
      ],
      [
        "يطوي Escape الصف المفتوح من أي مكان فيه، البطاقة ضمنًا، ولا يسجّل شيئًا.",
        "Escape anywhere in an open row folds it and records nothing, the card included.",
      ],
      [
        "يقرّر تطبيقك حالة كل عنصر. وإذا نقله من التبويب بقي صفّه مكانه خمس ثوانٍ مع إيصاله ثم غادر، وانتقل التركيز إلى الصف التالي، ويلغي receiptFor={0} هذه المهلة. ويُعلن العدد حين يتغيّر فقط.",
        "Your app owns each item's status. When it moves an item out of the tab, the row stays in place for five seconds with its receipt, then leaves, and focus moves to the next row; receiptFor={0} turns the wait off. The counts are announced only when they change.",
      ],
    ],
  },
  "approval-flow": {
    useWhen: [
      [
        "يحتاج الوكيل إلى عدة موافقات منفصلة، ولكل منها قرار مستقل.",
        "An agent needs several separate approvals, and each one needs its own decision.",
      ],
      [
        "تريد أن يعرف المستخدم مكانه في السلسلة: أي طلب هو من كم.",
        "You want people to know where they are: which request out of how many.",
      ],
    ],
    instead: [
      {
        text: ["يكفي قرار واحد، فاستخدم", "One decision is enough, so use"],
        page: "approval-card",
      },
      {
        text: [
          "تطلب إجابات لا موافقات، فاستخدم",
          "You are asking for answers, not approvals, so use",
        ],
        page: "ask-user-questions",
      },
    ],
    notice: [
      [
        "يرتبط كل قرار بمعرّف طلبه وبصمة محتواه، فإذا تغيّر الطلب لم يعد القرار القديم ينطبق عليه.",
        "Each decision is tied to its request's ID and a fingerprint of its content, so if the request changes, the old decision no longer applies.",
      ],
      [
        "يظهر رقم الطلب من إجمالي الطلبات بحسب إعداد الأرقام، عربية كانت أو لاتينية.",
        "The request number out of the total follows the numerals setting, Arabic or Latin.",
      ],
      [
        "لا يوافق اختصار مضغوط على الطلب التالي: ينتظر Ctrl أو Cmd+Enter نصف ثانية بعد ظهور كل طلب.",
        "A held shortcut never approves the next request: Ctrl or Cmd+Enter waits half a second after each request appears.",
      ],
    ],
  },
  "selection-actions": {
    useWhen: [
      [
        "يحدّد المستخدم جملة في رد طويل ويريد أن يطلب شرحها أو اختصارها أو ترجمتها بنقرة.",
        "Someone selects a sentence in a long reply and wants to ask for an explanation, a shorter version or a translation in one click.",
      ],
    ],
    instead: [
      {
        text: [
          "تنطبق الإجراءات على عنصر كامل لا على نص محدّد، فاستخدم",
          "The actions apply to a whole item, not to selected text, so use",
        ],
        page: "dropdown",
      },
    ],
    notice: [
      [
        "لا يأخذ الشريط التركيز وحده. بعد التحديد اضغط Alt+Enter للانتقال إلى الإجراءات، ثم Escape للعودة إلى النص.",
        "The bar never takes focus by itself. After selecting, press Alt+Enter to reach the actions and Escape to return to the text.",
      ],
      [
        "لا يعمل داخل الحقول والكود والروابط والأزرار، ولا مع تحديد يتجاوز النطاق الذي عيّنته.",
        "It does not work inside fields, code, links or buttons, or on a selection that crosses the scope you set.",
      ],
    ],
  },
  "context-meter": {
    useWhen: [
      [
        "يريد المستخدم أن يعرف كم بقي من مساحة المحادثة قبل أن تمتلئ.",
        "Someone wants to know how much room is left in the conversation before it fills up.",
      ],
    ],
    instead: [
      {
        text: [
          "تعرض نسبة تقدّم عامة لا علاقة لها بسعة السياق، فاستخدم",
          "You are showing general progress unrelated to context capacity, so use",
        ],
        page: "progress",
      },
    ],
    notice: [
      [
        "لا تعتمد الدلالة على اللون وحده: يصف الزر القيم والنسبة والحالة بالكلمات، ويظهر تجاوز السعة برقمه الفعلي.",
        "Meaning never rests on color alone. The button describes the values, the percentage and the status in words, and an overflow shows its real number.",
      ],
      [
        "يفتح Enter أو Space التفاصيل، ويعيد Escape التركيز إلى الزر.",
        "Enter or Space opens the details, and Escape returns focus to the button.",
      ],
    ],
  },
  "model-selector": {
    useWhen: [
      [
        "يختار المستخدم النموذج الذي سيجيب عن أسئلته، ويحتاج إلى وصف موجز لكل خيار.",
        "Someone chooses which model answers their questions and needs a short description of each option.",
      ],
    ],
    instead: [
      {
        text: [
          "الخيارات قصيرة بلا وصف أو بيانات إضافية، فاستخدم",
          "The options are short, with no descriptions or extra details, so use",
        ],
        page: "select",
      },
    ],
    notice: [
      [
        "تبقى النماذج غير المتاحة ظاهرة لكنها معطّلة، وتتخطاها الأسهم عند التنقّل.",
        "Unavailable models stay visible but disabled, and the arrow keys skip them.",
      ],
      [
        "لا يستبدل المكوّن اختيار المستخدم حين تتغيّر القائمة. وإن غاب المعرّف المختار ظهر النص الإرشادي دون إرسال أي حدث.",
        "A changed list never replaces the person's choice. If the chosen ID disappears, the placeholder shows and no change event is sent.",
      ],
    ],
  },
  "image-result": {
    useWhen: [
      [
        "يستعرض المستخدم صورًا ولّدها الوكيل، ويحتاج إلى معرفة أيّها ما زال يُحمَّل وأيّها تعذّر تحميله.",
        "Someone looks through images an agent made and needs to know which are still loading and which failed.",
      ],
    ],
    instead: [
      {
        text: [
          "الصورة تمثّل شخصًا لا نتيجة، فاستخدم",
          "The picture stands for a person, not a result, so use",
        ],
        page: "avatar",
      },
    ],
    notice: [
      [
        "النص البديل مطلوب، ويبقى ظاهرًا إن تعذّر تحميل الصورة.",
        "Alt text is required, and it stays visible if the image fails to load.",
      ],
      [
        "تظهر نسبة التحميل حين تمرّر نسبة فعلية من تطبيقك فقط، ودونها يظهر تحميل بلا رقم.",
        "A loading percentage appears only when your app passes a real one. Without it, loading shows no number.",
      ],
    ],
  },
  sources: {
    useWhen: [
      [
        "يريد القارئ أن يتحقق من أين جاءت معلومة في رد المساعد.",
        "A reader wants to check where a claim in the assistant's reply came from.",
      ],
      [
        "ترفق الرد بقائمة مصادر مرقّمة يفتحها المستخدم ويطويها.",
        "You attach a numbered list of sources that readers can open and fold away.",
      ],
    ],
    instead: [
      {
        text: [
          "تحتاج رابطًا عاديًا واحدًا داخل نص منسّق، فاستخدم",
          "You only need an ordinary link inside formatted text, so use",
        ],
        page: "markdown",
      },
    ],
    notice: [
      [
        "ترقيم المصادر من عندك ولا يتغيّر عند إعادة الترتيب أو التصفية، وتتبع الأرقام الظاهرة إعداد الأرقام.",
        "Source numbers come from you and never change when sources are reordered or filtered. The visible digits follow the numerals setting.",
      ],
      [
        "تُفتح التفاصيل بالنقر أو Enter أو Space لا بالمرور، ويبقى المصدر بلا رابط صالح نصًا عاديًا.",
        "Details open on click, Enter or Space, never on hover. A source without a safe link stays plain text.",
      ],
    ],
  },
  "insight-cards": {
    useWhen: [
      [
        "ينهي الوكيل تحليلًا ويريد المستخدم أن يتصفح أهم ما وجده، واحدًا بعد آخر.",
        "An agent finishes an analysis and the person wants to go through its main findings one after another.",
      ],
    ],
    instead: [
      {
        text: [
          "تجمع محتوى عاديًا لا نتائج متتابعة، فاستخدم",
          "You are grouping ordinary content, not a series of findings, so use",
        ],
        page: "card",
      },
    ],
    notice: [
      [
        "تظهر نتيجة واحدة في كل مرة مع زرّي السابق والتالي. ويحفظ المكوّن النتيجة المختارة إن تغيّر الترتيب، ولا يعرض الزرين لنتيجة وحيدة.",
        "One finding shows at a time, with previous and next buttons. A reorder keeps the selected finding, and a single finding gets no buttons.",
      ],
      [
        "تظهر الإجراءات إن مرّرتها فقط، ولا تستخدم لونًا دلاليًا إلا إذا بررته البيانات.",
        "Actions appear only if you supply them. Use a semantic tone only when the data justifies it.",
      ],
    ],
  },
  "chat-thread": {
    useWhen: [
      [
        "تتراكم الرسائل بين المستخدم والمساعد ويعود المستخدم لقراءة القديم منها.",
        "Messages pile up between a person and an assistant, and the person goes back to read earlier ones.",
      ],
    ],
    instead: [
      {
        text: [
          "تحتاج حقلًا لكتابة الرسالة لا لعرضها، فاستخدم",
          "You need a field to write the message, not to show it, so use",
        ],
        page: "chat-composer",
      },
      {
        text: [
          "تحتاج قائمة محادثات ينتقل بينها المستخدم، فاستخدم",
          "People need to switch between conversations, so use",
        ],
        page: "chat-app",
      },
    ],
    notice: [
      [
        "لا يتتبع المكوّن الرسائل الجديدة افتراضيًا. وإذا فعّلت followOutput فلن يتتبعها إلا ما دام المستخدم قرب النهاية.",
        "The thread does not follow new messages by default. With followOutput on, it follows them only while the reader is near the bottom.",
      ],
      [
        "لا تُعلن الرسائل الجديدة لقارئ الشاشة من تلقاء نفسها. يتولّى تطبيقك إعلان حالة واحدة موجزة عند بدء الرد أو انتهائه.",
        "New messages are not announced to a screen reader on their own. Your app announces one short status when a reply starts or finishes.",
      ],
    ],
  },
  "chat-composer": {
    useWhen: [
      [
        "يكتب المستخدم رسالة طويلة في محادثة ويريد أن يراجعها قبل أن يرسلها.",
        "Someone writes a long message in a conversation and wants to review it before sending.",
      ],
      [
        "يحتاج المستخدم إلى إيقاف رد ما زال يصل.",
        "Someone needs to stop a reply that is still arriving.",
      ],
    ],
    instead: [
      {
        text: [
          "تريد حقلًا مدمجًا لبدء مهمة لا لمتابعة محادثة، فاستخدم",
          "You want a compact field to start a task, not to continue a conversation, so use",
        ],
        page: "prompt-bar",
      },
      {
        text: [
          "تحتاج حقل نص عاديًا في نموذج، فاستخدم",
          "You need an ordinary text field in a form, so use",
        ],
        page: "textarea",
      },
    ],
    notice: [
      [
        "يرسل Enter ويضيف Shift+Enter سطرًا جديدًا، ولا يرسل أثناء الكتابة بمحرر إدخال (IME).",
        "Enter sends and Shift+Enter adds a new line. It never sends while an input method (IME) is composing.",
      ],
      [
        "يبدأ المؤشر من اليمين في الواجهة العربية مهما كانت لغة المسودة.",
        "In an Arabic interface the caret starts on the right whatever language the draft is in.",
      ],
    ],
  },
  "prompt-bar": {
    useWhen: [
      [
        "يفتح المستخدم الصفحة ويريد أن يصف للوكيل ما يريده في سطر أو سطرين.",
        "Someone opens a page and wants to tell an agent what they need in a line or two.",
      ],
    ],
    instead: [
      {
        text: [
          "تدور محادثة طويلة وتحتاج مساحة أكبر للكتابة، فاستخدم",
          "A long conversation is under way and needs more room to write, so use",
        ],
        page: "chat-composer",
      },
      {
        text: [
          "يكفي حقل نصي في نموذج عادي، فاستخدم",
          "A plain text field in an ordinary form is enough, so use",
        ],
        page: "input",
      },
    ],
    notice: [
      [
        "تظهر الاقتراحات والحقل فارغ فقط، وتتعطّل أثناء انشغال الوكيل. وتقرّر أنت هل يملأ الاختيار الحقل أم يرسل.",
        "Suggestions show only while the field is empty and are disabled while the agent is busy. You decide whether picking one fills the field or sends it.",
      ],
      [
        "يبدأ المؤشر من اليمين في الواجهة العربية، ويتمدّد الحقل إلى حدّ ثم يتمرّر داخليًا.",
        "In an Arabic interface the caret starts on the right, and the field grows to a limit, then scrolls inside itself.",
      ],
    ],
  },
  "loading-state": {
    useWhen: [
      [
        "يستغرق عمل ما أكثر من لحظة، ويحتاج المستخدم إلى أن يعرف ما الذي ينتظره.",
        "Something takes more than a moment and people need to know what they are waiting for.",
      ],
      [
        "تريد عرض الوقت المنقضي في عمل طويل.",
        "You want to show how long a long job has been running.",
      ],
    ],
    instead: [
      {
        text: [
          "تحتاج مؤشرًا صغيرًا بجوار نص موجود، فاستخدم",
          "You need a small indicator next to existing text, so use",
        ],
        page: "spinner",
      },
      {
        text: [
          "تعرف شكل المحتوى القادم وتريد حجز مكانه، فاستخدم",
          "You know the shape of the content that is coming and want to hold its place, so use",
        ],
        page: "skeleton",
      },
    ],
    notice: [
      [
        "يقرأ قارئ الشاشة التسمية والوصف مرة واحدة، ولا يغيّر عدّاد الوقت ما يُعلَن.",
        "A screen reader reads the label and description once, and the ticking time never changes what is announced.",
      ],
      [
        "يتبع الوقت المنقضي إعداد الأرقام، ومع تقليل الحركة تتوقف الشبكة المتحركة.",
        "Elapsed time follows the numerals setting, and with reduced motion the animated grid stops.",
      ],
    ],
  },
  "thinking-indicator": {
    useWhen: [
      [
        "يرسل المستخدم رسالة وينتظر أن يبدأ المساعد بالرد.",
        "Someone sends a message and waits for the assistant to start answering.",
      ],
    ],
    instead: [
      {
        text: [
          "تريد أن يطّلع المستخدم على خطوات النشاط عند الحاجة، فاستخدم",
          "You want people to see the activity steps when they ask for them, so use",
        ],
        page: "thinking-state",
      },
      {
        text: [
          "تحتاج مؤشر انتظار عامًا خارج واجهة المساعد، فاستخدم",
          "You need a general waiting indicator outside the assistant, so use",
        ],
        page: "spinner",
      },
    ],
    notice: [
      [
        "تتبدّل الكلمات للعين فقط، أما الاسم الذي يقرؤه قارئ الشاشة فيبقى ثابتًا.",
        "The changing words are for the eye only. The name a screen reader reads stays fixed.",
      ],
      [
        "تدل الكلمات المتبدّلة على أن العمل جارٍ، لا على مقدار ما أُنجز منه.",
        "The changing words show that work is under way, not how much is done.",
      ],
    ],
  },
  "thinking-state": {
    useWhen: [
      [
        "يعمل المساعد عدة ثوانٍ قبل أن يرد، ويريد المستخدم أن يطمئن إلى أن العمل يتقدّم دون أن يقرأ كل خطوة.",
        "The assistant works for several seconds before replying, and people want to know it is moving without reading every step.",
      ],
    ],
    instead: [
      {
        text: [
          "تحتاج حالة واحدة قصيرة بلا تفاصيل، فاستخدم",
          "You need one short status with no details, so use",
        ],
        page: "thinking-indicator",
      },
      {
        text: [
          "لديك عدة مهام لكل منها حالتها، فاستخدم",
          "You have several tasks, each with its own state, so use",
        ],
        page: "task-rows",
      },
    ],
    notice: [
      [
        "اعرض خطوات يفهمها المستخدم، لا استدلال النموذج الداخلي ولا سجلات مختلقة.",
        "Show steps a person can follow, never the model's private reasoning or invented logs.",
      ],
      [
        "تُخفى التفاصيل المطوية فورًا، وإن كان التركيز بداخلها عاد إلى الزر.",
        "Collapsed details hide at once, and focus inside them returns to the button.",
      ],
    ],
  },
  "task-rows": {
    useWhen: [
      [
        "ينفّذ الوكيل عدة مهام ويريد المستخدم أن يرى أيّها اكتملت وأيّها تعثّرت.",
        "An agent works on several tasks and the person wants to see which finished and which failed.",
      ],
    ],
    instead: [
      {
        text: [
          "تلخّص نشاط الأدوات في سطر واحد، فاستخدم",
          "You are summarizing tool activity in one line, so use",
        ],
        page: "tool-chips",
      },
      {
        text: [
          "تعرض عملية واحدة بتفاصيلها، فاستخدم",
          "You are showing one operation in detail, so use",
        ],
        page: "tool-call",
      },
    ],
    notice: [
      [
        "فتح الصف أو إغلاقه لا يغيّر تنفيذ المهمة، ويمكن فتح عدة صفوف معًا.",
        "Opening or closing a row never changes the task, and several rows can be open at once.",
      ],
      [
        "تُفهم الحالة من الشارة والمؤشر والنص معًا، فلا تعتمد على اللون وحده.",
        "The state is carried by the badge, the icon and the text together, never by color alone.",
      ],
    ],
  },
  "tool-call": {
    useWhen: [
      [
        "يريد المستخدم أن يتحقق مما أرسله الوكيل إلى أداة وما عاد منها.",
        "Someone wants to check what an agent sent to a tool and what came back.",
      ],
      [
        "تعثّر استدعاء ويحتاج المستخدم إلى إعادة المحاولة.",
        "A call failed and the person needs to try it again.",
      ],
    ],
    instead: [
      {
        text: [
          "تلخّص عدة أدوات في سطر واحد، فاستخدم",
          "You are summarizing several tools in one line, so use",
        ],
        page: "tool-chips",
      },
      {
        text: [
          "تتابع مهام أوسع من استدعاء واحد، فاستخدم",
          "You are tracking tasks broader than a single call, so use",
        ],
        page: "task-rows",
      },
    ],
    notice: [
      [
        "لا يُعلَن عند تغيّر الحالة إلا العنوان والحالة، دون المدة أو المخرجات.",
        "A state change announces only the label and the state, never the duration or the output.",
      ],
      [
        "يظهر زر إعادة المحاولة خارج زر التوسيع عند التعثّر، ويعود التركيز إلى زر التوسيع عند الطيّ.",
        "The retry button sits outside the expand button when a call fails, and collapsing returns focus to the expand button.",
      ],
    ],
  },
  "tool-chips": {
    useWhen: [
      [
        "استخدم الوكيل عدة أدوات، ويكفي المستخدم أن يعرف أيّها اكتملت.",
        "An agent used several tools and the person only needs to know which finished.",
      ],
    ],
    instead: [
      {
        text: [
          "تحتاج مدخلات استدعاء واحد ومخرجاته، فاستخدم",
          "You need the input and output of one call, so use",
        ],
        page: "tool-call",
      },
      {
        text: [
          "تتابع مهام لا استدعاءات أدوات، فاستخدم",
          "You are tracking tasks, not tool calls, so use",
        ],
        page: "task-rows",
      },
    ],
    notice: [
      [
        "لا تفتح الشرائح تفاصيل ولا تشغّل أدوات من تلقاء نفسها.",
        "Chips never open details or run tools on their own.",
      ],
      [
        "لا تمرّر controls وexpanded إلا حين تشير الشريحة فعلًا إلى تفاصيل موجودة.",
        "Pass controls and expanded only when the chip really points at details.",
      ],
    ],
  },
  "code-block": {
    useWhen: [
      [
        "يريد المطوّر أن ينسخ مقطعًا برمجيًا من رد المساعد كما هو.",
        "A developer wants to copy a snippet from the assistant's reply exactly as written.",
      ],
      [
        "تعرض أمرًا أو ملف إعدادات ليقرأه المستخدم وينسخه.",
        "You show a command or a config file for people to read and copy.",
      ],
    ],
    instead: [
      {
        text: [
          "تعرض مخرجات أمر نُفِّذ لا كودًا مصدريًا، فاستخدم",
          "You are showing the output of a command that ran, not source code, so use",
        ],
        page: "terminal",
      },
      {
        text: [
          "تعرض ردًا منسّقًا فيه فقرات وجداول، فاستخدم",
          "You are showing a formatted reply with paragraphs and tables, so use",
        ],
        page: "markdown",
      },
    ],
    notice: [
      [
        "يبقى الكود باتجاه LTR حتى في الواجهة العربية، أما زر النسخ فيتبع اتجاه الواجهة.",
        "Code stays left-to-right even in an Arabic interface, while the copy button follows the interface direction.",
      ],
      [
        "يشمل التلوين بضع لغات فقط، وما عداها يظهر نصًا عاديًا. ولا شيء يُنفَّذ.",
        "Only a few languages are highlighted. Any other shows as plain text, and nothing is ever run.",
      ],
    ],
  },
  markdown: {
    useWhen: [
      [
        "تعرض محتوى كتبه مستخدم أو نموذج ولا تثق بما فيه من HTML.",
        "You display content written by a person or a model and cannot trust any HTML in it.",
      ],
    ],
    instead: [
      {
        text: [
          "يصل النص تباعًا ويجب أن يظهر وهو يصل، فاستخدم",
          "The text arrives bit by bit and must show as it comes, so use",
        ],
        page: "streaming-text",
      },
      {
        text: [
          "تعرض كودًا فقط، فاستخدم",
          "You are showing code and nothing else, so use",
        ],
        page: "code-block",
      },
    ],
    notice: [
      [
        "يُهمَل HTML الخام. ويظهر الرابط ذو البروتوكول غير الآمن نصًا عاديًا، وتظهر الصورة غير الآمنة بنصها البديل.",
        "Raw HTML is dropped. A link with an unsafe protocol shows as text, and an unsafe image shows as its alt text.",
      ],
      [
        "يبقى الكود باتجاه LTR داخل النص العربي، وتتمرّر الجداول داخل حاويتها ويمكن بلوغها بلوحة المفاتيح.",
        "Code stays left-to-right inside Arabic text. Tables scroll inside their own container and can be reached by keyboard.",
      ],
    ],
  },
  "streaming-text": {
    useWhen: [
      [
        "يصل رد النموذج قطعة بعد قطعة، ويريد المستخدم أن يقرأه وهو يُكتب.",
        "A model's reply arrives piece by piece and people want to read it as it is written.",
      ],
    ],
    instead: [
      {
        text: [
          "النص كامل منذ البداية، فاستخدم",
          "The text is complete from the start, so use",
        ],
        page: "markdown",
      },
    ],
    notice: [
      [
        "لا يقرأ قارئ الشاشة الرد أثناء وصوله، بل يسمع حالة واحدة موجزة.",
        "A screen reader does not read the reply as it arrives. It hears one short status instead.",
      ],
      [
        "مع تقليل الحركة يظهر النص فورًا. وعند الإلغاء أبقِ ما وصل واجعل state مساوية لـ stopped، وعند الفشل اجعلها failed. فيزول المؤشر وتُعلن الحالة.",
        "With reduced motion the text appears at once. If a stream is cancelled, keep what arrived and set state to stopped; if it fails, set failed. The cursor goes and the state is announced.",
      ],
    ],
  },

  // Forms
  button: {
    useWhen: [
      [
        "يضغط المستخدم ليحفظ أو يرسل أو يحذف أو يتابع.",
        "Someone presses to save, send, delete or continue.",
      ],
      [
        "تريد إبراز إجراء رئيسي واحد في الصفحة وتخفيف ما حوله من إجراءات.",
        "You want one main action to stand out on the page and the others to sit quieter.",
      ],
    ],
    instead: [
      {
        text: [
          "يبقى الخيار مفعّلًا أو متوقفًا بعد اللمس، فاستخدم",
          "The choice stays on or off after it is touched, so use",
        ],
        page: "switch",
      },
      {
        text: [
          "ينتقل المستخدم بين عروض مرتبطة، فاستخدم",
          "People are moving between related views, so use",
        ],
        page: "tabs",
      },
    ],
    notice: [
      [
        "تتحكم أنت في الحالة: يمنع التحميل الضغط ويعلن أن الزر مشغول، لكن الزر لا يعود إلى حالته الأولى وحده.",
        "You control the state. Loading blocks presses and marks the button busy, but the button never returns to idle by itself.",
      ],
      [
        "الزر الذي يكتفي بأيقونة يحتاج إلى اسم يقرؤه قارئ الشاشة.",
        "A button with only an icon needs a name for screen readers.",
      ],
    ],
  },
  input: {
    useWhen: [
      [
        "يكتب المستخدم اسمًا أو بريدًا أو كلمة بحث، أي نصًا في سطر واحد.",
        "Someone types a name, an email or a search, one line of text.",
      ],
    ],
    instead: [
      {
        text: [
          "يكتب المستخدم عدة أسطر، فاستخدم",
          "People write several lines, so use",
        ],
        page: "textarea",
      },
      {
        text: [
          "يختار المستخدم من قائمة محددة سلفًا، فاستخدم",
          "People pick from a fixed list, so use",
        ],
        page: "select",
      },
    ],
    notice: [
      [
        "يدعم الحقل الأنواع text وemail وpassword وsearch وtel وurl فقط.",
        "Only the types text, email, password, search, tel and url are supported.",
      ],
      [
        "يعلّم الخطأ الحقل غير صالح فقط، أما قواعد التحقق وصياغة الرسالة فمن تطبيقك.",
        "An error only marks the field invalid. The rules and the wording come from your app.",
      ],
    ],
  },
  slider: {
    useWhen: [
      [
        "يضبط المستخدم قيمة ضمن نطاق، كمستوى الصوت أو حجم الخط، ولا تهمه القيمة الدقيقة بقدر الموضع.",
        "Someone adjusts a value within a range, such as volume or text size, where the position matters more than the exact figure.",
      ],
    ],
    instead: [
      {
        text: [
          "يحتاج المستخدم إلى إدخال رقم محدد، فاستخدم",
          "People need to enter an exact number, so use",
        ],
        page: "input",
      },
    ],
    notice: [
      [
        "يتبع الشريط اتجاه الواجهة، فيبدأ من اليمين في RTL، وتعمل الأسهم وHome وEnd كما في المتصفح.",
        "The track follows the interface direction, so in RTL it starts on the right. Arrow keys, Home and End work as in the browser.",
      ],
      [
        "تُقرَّب القيمة إلى أقرب خطوة. ويغيّر formatValue ما يُقرأ على الشاشة لا القيمة المرسلة في النموذج.",
        "The value snaps to the nearest step. formatValue changes how it reads, not what the form submits.",
      ],
    ],
  },
  "otp-input": {
    useWhen: [
      [
        "يتلقى المستخدم رمز تحقق برسالة نصية أو بريد، ويحتاج إلى إدخاله.",
        "Someone receives a verification code by message or email and has to enter it.",
      ],
    ],
    instead: [
      {
        text: [
          "القيمة نص حر وليست رمزًا من أرقام، فاستخدم",
          "The value is free text, not a code of digits, so use",
        ],
        page: "input",
      },
    ],
    notice: [
      [
        "تُقبل الأرقام العربية والفارسية واللاتينية وتتحول كلها إلى أرقام لاتينية، ويُحذف ما ليس رقمًا.",
        "Arabic, Persian and Latin digits are accepted and all become Latin digits. Anything that isn't a digit is dropped.",
      ],
      [
        "يُكتب الرمز دائمًا من اليسار إلى اليمين. واكتمال الخانات لا ينقل التركيز ولا يرسل النموذج.",
        "The code always reads left to right. Filling every slot neither moves focus nor submits the form.",
      ],
    ],
  },
  "date-picker": {
    useWhen: [
      [
        "يحدّد المستخدم تاريخ استحقاق أو تسليم، أو تاريخ ميلاد.",
        "Someone picks a due date, a delivery date or a birthday.",
      ],
    ],
    instead: [
      {
        text: [
          "يكفي أن يكتب المستخدم التاريخ في حقل نص، فاستخدم",
          "Typing the date into a text field is enough, so use",
        ],
        page: "input",
      },
    ],
    notice: [
      [
        "القيمة تاريخ ميلادي بصيغة YYYY-MM-DD دائمًا، ولا يغيّر RTL معناها.",
        "The value is always a Gregorian YYYY-MM-DD string, and RTL never changes its meaning.",
      ],
      [
        "يتنقل المستخدم في التقويم بالأسهم وHome وEnd وPageUp وPageDown، ويغلقه Escape فيعود التركيز إلى الزر.",
        "Arrow keys, Home, End, PageUp and PageDown move through the calendar. Escape closes it and returns focus to the button.",
      ],
    ],
  },
  "tag-input": {
    useWhen: [
      [
        "يضيف المستخدم عدة وسوم أو كلمات مفتاحية أو مستلمين إلى عنصر.",
        "Someone adds several tags, keywords or recipients to an item.",
      ],
    ],
    instead: [
      {
        text: [
          "تكفي قيمة نصية واحدة، فاستخدم",
          "One text value is enough, so use",
        ],
        page: "input",
      },
      {
        text: [
          "تُختار القيمة من قائمة ثابتة، فاستخدم",
          "The value is picked from a fixed list, so use",
        ],
        page: "select",
      },
    ],
    notice: [
      [
        "يضيف Enter النص وسمًا بعد حذف المسافات من طرفيه، ويرفض الفارغ والمكرر، ولا يضيف أثناء الكتابة بمحرر إدخال (IME).",
        "Enter adds the text as a tag, trimmed. Empty and duplicate entries are refused, and Enter does nothing while an input method (IME) is composing.",
      ],
      [
        "يحذف Backspace في الحقل الفارغ آخر وسم، وبعد حذف وسم بزرّه يعود التركيز إلى حقل النص.",
        "Backspace in an empty field removes the last tag. After a tag is removed with its button, focus returns to the text field.",
      ],
    ],
  },
  "color-picker": {
    useWhen: [
      [
        "يختار المستخدم لون العلامة التجارية أو لون وسم أو سمة.",
        "Someone picks a brand, tag or theme color.",
      ],
    ],
    instead: [
      {
        text: [
          "اللون واحد من خيارات قليلة بأسماء لا بقيم، فاستخدم",
          "The color is one of a few named options, not a free value, so use",
        ],
        page: "select",
      },
    ],
    notice: [
      [
        "يُعتمد الرمز عند الضغط على Enter أو مغادرة الحقل، ويُكتب الرمز المختصر بصيغته الكاملة. وإن كان الرمز خاطئًا بقي كما كُتب ولم يتغيّر اللون.",
        "Enter or leaving the field commits the HEX code, and a short code is written out in full. An invalid code stays as typed and the color does not change.",
      ],
      [
        "حقل HEX باتجاه LTR دائمًا، ويختلف مظهر منتقي المتصفح من متصفح إلى آخر.",
        "The HEX field is always left-to-right, and the browser's own chooser looks different from browser to browser.",
      ],
    ],
  },
  "input-copy": {
    useWhen: [
      [
        "يحتاج المستخدم إلى نسخ مفتاح أو رابط دعوة أو رقم مرجعي بنقرة.",
        "Someone needs to copy a key, an invite link or a reference number in one click.",
      ],
    ],
    instead: [
      {
        text: [
          "تنسخ كتلة كود لا قيمة قصيرة، فاستخدم",
          "You are copying a block of code, not a short value, so use",
        ],
        page: "code-block",
      },
      {
        text: [
          "يعدّل المستخدم النص نفسه، فاستخدم",
          "People edit the text itself, so use",
        ],
        page: "input",
      },
    ],
    notice: [
      [
        "لا يظهر النجاح إلا بعد أن يقبل المتصفح النسخ فعلًا. ويبقى الفشل ظاهرًا مع إرشاد إلى النسخ اليدوي.",
        "Success shows only once the browser has really accepted the copy. A failure stays visible, with a hint to copy by hand.",
      ],
      [
        "زر النسخ داخل الحقل عند نهايته: على اليسار في RTL وعلى اليمين في LTR.",
        "The copy button sits inside the field at its end: on the left in RTL and on the right in LTR.",
      ],
    ],
  },
  select: {
    useWhen: [
      [
        "يختار المستخدم حالة أو بلدًا أو فئة من قائمة يطول عرضها كاملة.",
        "Someone picks a status, a country or a category from a list too long to show in full.",
      ],
    ],
    instead: [
      {
        text: [
          "الخيارات قليلة ويفيد أن تظهر كلها، فاستخدم",
          "The options are few and worth showing together, so use",
        ],
        page: "radio-group",
      },
      {
        text: [
          "تعرض إجراءات لا قيمة تُحفظ في نموذج، فاستخدم",
          "You are offering actions, not a value to save in a form, so use",
        ],
        page: "dropdown",
      },
    ],
    notice: [
      [
        "لا بحث ولا اختيار متعدد، وتتخطى الأسهم الخيارات المعطّلة.",
        "There is no search and no multiple choice, and arrow keys skip disabled options.",
      ],
      [
        "تنقل الكتابة التركيز إلى الخيار المطابق، والقيمة الفارغة تُظهر النص الإرشادي.",
        "Typing jumps to a matching option, and the empty value shows the placeholder.",
      ],
    ],
  },
  checkbox: {
    useWhen: [
      [
        "يوافق المستخدم على شرط، أو يفعّل خيارًا أو أكثر من عدة خيارات مستقلة.",
        "Someone agrees to a term, or turns on one or more of several independent options.",
      ],
    ],
    instead: [
      {
        text: [
          "تغيّر إعدادًا يسري فور تبديله، فاستخدم",
          "You are changing a setting that applies the moment it is flipped, so use",
        ],
        page: "switch",
      },
      {
        text: [
          "لا يختار المستخدم إلا خيارًا واحدًا من مجموعة، فاستخدم",
          "People may choose only one option from a group, so use",
        ],
        page: "radio-group",
      },
    ],
    notice: [
      [
        "لا توجد حالة وسطى ولا تحديد صفوف: المربع إما محدّد وإما غير محدّد.",
        "There is no in-between state and no row selection. A checkbox is either checked or not.",
      ],
      [
        "إن أدار المكوّن القيمة عادت إلى أصلها عند إعادة ضبط النموذج دون استدعاء onChange، وإن أدارها تطبيقك فهو من يعيد ضبطها.",
        "When the checkbox manages its own value, a form reset restores the starting value without calling onChange. When your app manages it, your app does the resetting.",
      ],
    ],
  },
  "radio-group": {
    useWhen: [
      [
        "يختار المستخدم وتيرة أو خطة أو طريقة دفع من خيارات قليلة تريدها ظاهرة معًا.",
        "Someone picks a frequency, a plan or a payment method from a few options you want visible together.",
      ],
    ],
    instead: [
      {
        text: [
          "الخيارات كثيرة ولا يتسع لها المكان، فاستخدم",
          "There are many options and no room for them, so use",
        ],
        page: "select",
      },
      {
        text: [
          "يجوز اختيار أكثر من خيار، فاستخدم",
          "People may choose more than one, so use",
        ],
        page: "checkbox",
      },
    ],
    notice: [
      [
        "يدخل Tab إلى المجموعة مرة واحدة وتنقل الأسهم الاختيار بين الخيارات، كما في الخيارات الأصلية في المتصفح.",
        "Tab enters the group once and the arrow keys move the choice, as in the browser's own radio buttons.",
      ],
      [
        "يسمّي label المجموعة كلها لقارئ الشاشة، ويعطّل disabled على المجموعة كل خياراتها دفعة واحدة.",
        "The label names the whole group for screen readers, and disabled on the group turns off every option at once.",
      ],
    ],
  },
  textarea: {
    useWhen: [
      [
        "يكتب المستخدم ملاحظة أو وصفًا أو تعليقًا أطول من سطر.",
        "Someone writes a note, a description or a comment longer than one line.",
      ],
    ],
    instead: [
      {
        text: [
          "يكتب المستخدم رسالة في محادثة، فاستخدم",
          "People write a message in a conversation, so use",
        ],
        page: "chat-composer",
      },
      {
        text: ["يكفي سطر واحد، فاستخدم", "One line is enough, so use"],
        page: "input",
      },
    ],
    notice: [
      [
        "لا يتمدّد الحقل مع النص ولا يعرض عدّاد أحرف. أضف ما تحتاجه من ذلك في تطبيقك.",
        "The field does not grow as people type and has no character counter. Add either in your app if you need it.",
      ],
      [
        "يبدأ بثلاثة أسطر، ويمكنك تغيير ذلك بالخاصية rows.",
        "It starts at three lines, and you can change that with rows.",
      ],
    ],
  },
  switch: {
    useWhen: [
      [
        "يغيّر المستخدم إعدادًا يسري فور تبديله، كالإشعارات أو الوضع الداكن.",
        "Someone changes a setting that applies the moment it is flipped, such as notifications or dark mode.",
      ],
    ],
    instead: [
      {
        text: [
          "الخيار جزء من نموذج يُرسل لاحقًا، فاستخدم",
          "The choice is part of a form that is sent later, so use",
        ],
        page: "checkbox",
      },
      {
        text: [
          "ينفّذ المستخدم أمرًا لا يبدّل حالة، فاستخدم",
          "People run a command rather than flip a state, so use",
        ],
        page: "button",
      },
    ],
    notice: [
      [
        "تتبدّل الحالة بـ Space أو Enter، ويقرأ قارئ الشاشة نص الوصف مع اسم الإعداد.",
        "Space or Enter flips it, and a screen reader reads the description with the setting's name.",
      ],
    ],
  },

  // Files
  "file-tree": {
    useWhen: [
      [
        "يتصفح المستخدم ملفات مشروع ويختار منها ما يفتحه.",
        "Someone browses a project's files and picks one to open.",
      ],
    ],
    instead: [
      {
        text: [
          "تعرض روابط التنقّل بين صفحات تطبيقك، فاستخدم",
          "You are showing links between the pages of your app, so use",
        ],
        page: "sidebar",
      },
      {
        text: [
          "يضيف المستخدم ملفات من جهازه، فاستخدم",
          "People add files from their own device, so use",
        ],
        page: "file-dropzone",
      },
    ],
    notice: [
      [
        "تنعكس الأسهم الأفقية في RTL: يفتح السهم الأيسر المجلد ويطويه السهم الأيمن.",
        "Horizontal arrows mirror in RTL: the left arrow opens a folder and the right arrow closes it.",
      ],
      [
        "تنقل الأسهم التركيز ولا تغيّر الاختيار. يختار Space العنصر، ويختاره Enter ويفعّله.",
        "Arrow keys move focus without changing the selection. Space selects, and Enter selects and activates.",
      ],
    ],
  },
  "file-dropzone": {
    useWhen: [
      [
        "يرفق المستخدم مستندًا أو صورة بطلب أو نموذج.",
        "Someone attaches a document or an image to a request or a form.",
      ],
    ],
    instead: [
      {
        text: [
          "الملفات موجودة في تطبيقك والمستخدم يتصفحها لا يضيفها، فاستخدم",
          "The files already live in your app and people browse them rather than add them, so use",
        ],
        page: "file-tree",
      },
    ],
    notice: [
      [
        "لا تُرسَل الملفات المختارة مع النموذج وحدها. ابنِ منها FormData بنفسك، وافحصها على الخادم أيضًا.",
        "The chosen files are not part of the form on their own. Build FormData from them yourself, and check them on the server too.",
      ],
      [
        "يُتجاهل الملف المكرر مع رسالة، وبعد حذف ملف ينتقل التركيز إلى زر التصفّح.",
        "A duplicate file is ignored with a message, and after a file is removed focus moves to the browse button.",
      ],
    ],
  },

  // Navigation
  sidebar: {
    useWhen: [
      [
        "يتنقل المستخدم بين أقسام تطبيق كبير ويحتاج إلى أن تبقى أمامه دائمًا.",
        "Someone moves between the sections of a large app and needs them always in view.",
      ],
    ],
    instead: [
      {
        text: [
          "تعرض عدة عروض لشيء واحد، فاستخدم",
          "You are offering several views of one thing, so use",
        ],
        page: "tabs",
      },
      {
        text: [
          "تُظهر موقع الصفحة داخل تسلسل، فاستخدم",
          "You are showing where a page sits in a hierarchy, so use",
        ],
        page: "breadcrumbs",
      },
    ],
    notice: [
      [
        "يضعه تطبيقك على اليمين في RTL وعلى اليسار في LTR، وتنعكس الإزاحة وأسهم الطيّ داخله وحدها.",
        "Your app places it on the right in RTL and on the left in LTR. The indentation and chevrons inside it mirror on their own.",
      ],
      [
        "في الوضع المطوي يحتاج كل عنصر إلى أيقونة، وتظهر تسميته في تلميح.",
        "When collapsed, every item needs an icon, and its label appears in a tooltip.",
      ],
    ],
  },
  tabs: {
    useWhen: [
      [
        "يبدّل المستخدم بين عروض مختلفة لشيء واحد، كالنظرة العامة والنشاط والإعدادات.",
        "Someone switches between different views of one thing, such as overview, activity and settings.",
      ],
    ],
    instead: [
      {
        text: [
          "يفتح المستخدم قسمًا ويُبقي بقية العناوين ظاهرة، فاستخدم",
          "People open one section while the other headings stay visible, so use",
        ],
        page: "accordion",
      },
      {
        text: [
          "ينتقل المستخدم إلى صفحات مختلفة تمامًا، فاستخدم",
          "People go to entirely different pages, so use",
        ],
        page: "sidebar",
      },
    ],
    notice: [
      [
        "تتبع الأسهم اتجاه الواجهة، فتنعكس في RTL.",
        "Arrow keys follow the interface direction, so they mirror in RTL.",
      ],
      [
        "لا يغيّر المكوّن رابط الصفحة ولا يحمّل بيانات التبويب. يتولّى تطبيقك ذلك.",
        "Tabs don't change the URL or load a tab's data. Your app does that.",
      ],
    ],
  },
  breadcrumbs: {
    useWhen: [
      [
        "يتعمّق المستخدم في صفحات متداخلة ويحتاج إلى طريق للعودة مستوى أو أكثر.",
        "Someone is several levels deep and needs a way back up.",
      ],
    ],
    instead: [
      {
        text: [
          "تنتقل بين أقسام متوازية، فاستخدم",
          "You are moving between parallel sections, so use",
        ],
        page: "sidebar",
      },
      {
        text: [
          "تنتقل بين صفحات نتائج متتابعة، فاستخدم",
          "You are moving through pages of results, so use",
        ],
        page: "pagination",
      },
    ],
    notice: [
      [
        "آخر عنصر هو الصفحة الحالية دائمًا، ويظهر نصًا حتى لو كان له رابط.",
        "The last item is always the current page and shows as text even if it has a link.",
      ],
      [
        "تنعكس الفواصل مع الاتجاه، ويلتف المسار على الشاشات الضيقة.",
        "Separators mirror with the direction, and the path wraps on narrow screens.",
      ],
    ],
  },
  pagination: {
    useWhen: [
      [
        "تتجاوز النتائج ما تتسع له صفحة واحدة، ويتنقل المستخدم بينها.",
        "Results run past what one page can hold, and people move through them.",
      ],
    ],
    instead: [
      {
        text: [
          "تحتاج جدولًا يبحث ويفرز ويقسّم الصفحات معًا، فاستخدم",
          "You need a table that searches, sorts and pages together, so use",
        ],
        page: "data-table",
      },
      {
        text: [
          "يتنقل المستخدم بين مراحل عملية بترتيب ثابت، فاستخدم",
          "People move through the stages of a process in fixed order, so use",
        ],
        page: "steps",
      },
    ],
    notice: [
      [
        "يعرض سبعة مواضع للصفحات على الأكثر، والفواصل نقاط لا تُنقر، ويتعطّل السابق والتالي عند الطرفين.",
        "At most seven page slots show, the ellipses can't be clicked, and Previous and Next disable at the ends.",
      ],
      [
        "تتبع أرقام الصفحات في العربية إعداد الأرقام، والضغط على الصفحة الحالية لا يستدعي شيئًا.",
        "In Arabic the page numbers follow the numerals setting, and pressing the current page does nothing.",
      ],
    ],
  },
  steps: {
    useWhen: [
      [
        "يبدأ المستخدم عملية طويلة كالتسجيل أو الدفع، ويحتاج إلى أن يعرف كم بقي منها.",
        "Someone starts a long process such as sign-up or checkout and needs to know how much is left.",
      ],
    ],
    instead: [
      {
        text: [
          "ينتقل المستخدم بين عروض لا ترتيب بينها، فاستخدم",
          "People move between views that have no order, so use",
        ],
        page: "tabs",
      },
      {
        text: [
          "تعرض أحداثًا وقعت بتواريخها، فاستخدم",
          "You are showing events that happened, with their dates, so use",
        ],
        page: "timeline",
      },
    ],
    notice: [
      [
        "لا تتحقق الخطوات من شيء ولا تتقدّم وحدها. يحدّد تطبيقك الخطوة الحالية وحالة كل خطوة.",
        "Steps validate nothing and never advance on their own. Your app sets the current step and each step's status.",
      ],
      [
        "تصبح كل خطوة زرًا حين تمرّر onStepActivate، فامنع في تطبيقك القفز إلى خطوة غير مسموحة.",
        "Passing onStepActivate makes every step a button, so your app must refuse a jump to a step that isn't allowed yet.",
      ],
    ],
  },

  // Data
  "filter-bar": {
    useWhen: [
      [
        "يضيّق المستخدم قائمة طويلة بالبحث وعدة عوامل تصفية، ويريد أن يرى ما طبّقه.",
        "Someone narrows a long list with a search and several filters, and wants to see what is applied.",
      ],
    ],
    instead: [
      {
        text: [
          "لا حاجة إلى عرض العوامل المطبّقة، فاستخدم",
          "There is no need to show the applied filters, so use",
        ],
        page: "input",
      },
      {
        text: [
          "تريد جدول عملاء جاهزًا بالبحث والفرز وتقسيم الصفحات، فاستخدم",
          "You want a ready-made customer table with search, sorting and paging, so use",
        ],
        page: "data-table",
      },
    ],
    notice: [
      [
        "لا يصفّي الشريط بيانات ولا يعدّ نتائج. تتولّى ذلك أنت في تطبيقك.",
        "The bar does not filter data or count results. Your app does both.",
      ],
      [
        "بعد إزالة عامل تصفية ينتقل التركيز إلى العامل التالي، فلا يفقد المستخدم مكانه.",
        "After a filter is removed, focus moves to the next one so the person doesn't lose their place.",
      ],
    ],
  },
  table: {
    useWhen: [
      [
        "تعرض بيانات في أعمدة وصفوف، كفواتير أو تقارير، ويكفي أن تُقرأ.",
        "You show data in rows and columns, such as invoices or reports, and reading it is enough.",
      ],
    ],
    instead: [
      {
        text: [
          "يحتاج المستخدم إلى البحث والفرز وتقسيم الصفحات، فاستخدم",
          "People need to search, sort and page, so use",
        ],
        page: "data-table",
      },
      {
        text: [
          "ما تعرضه أحداث متتابعة لا بيانات متعددة الأعمدة، فاستخدم",
          "What you show is a sequence of events, not multi-column data, so use",
        ],
        page: "timeline",
      },
    ],
    notice: [
      [
        "سمِّ الجدول بـ caption أو aria-label. وتستقبل حاويته التركيز ليتمكن مستخدم لوحة المفاتيح من التمرير أفقيًا.",
        "Name the table with a caption or an aria-label. Its container takes focus so keyboard users can scroll sideways.",
      ],
      [
        "ضع المحتوى المختلط الاتجاه في الخلايا داخل bdi، كرقم فاتورة وسط نص عربي، ليحتفظ بترتيبه.",
        "Wrap mixed-direction cell content, such as an invoice number inside Arabic text, in bdi so it keeps its order.",
      ],
    ],
  },
  "data-table": {
    useWhen: [
      [
        "يتابع فريق مبيعات أو دعم مئات العملاء، ويحتاج إلى الوصول إلى عميل بعينه بسرعة.",
        "A sales or support team handles hundreds of customers and needs to reach one quickly.",
      ],
    ],
    instead: [
      {
        text: [
          "تُجلب بياناتك من الخادم صفحة بعد صفحة، فابدأ من",
          "Your data is fetched from a server one page at a time, so start from",
        ],
        page: "table",
      },
      {
        text: [
          "تحتاج البحث والتصفية فقط فوق قائمتك، فاستخدم",
          "You only need search and filters above your own list, so use",
        ],
        page: "filter-bar",
      },
    ],
    notice: [
      [
        "يعود الجدول إلى الصفحة الأولى عند الفرز، وتُرتَّب الأرقام داخل النص بقيمتها، فيأتي «طلب ٢» قبل «طلب ١٠».",
        "Sorting returns to the first page, and numbers inside text sort by value, so “Order 2” comes before “Order 10”.",
      ],
      [
        "أثناء التحميل تتعطّل أزرار الصفحات ويُعلَن أن الجدول مشغول. وتمرّر أنت المحتوى الذي يظهر عند الفراغ أو الخطأ.",
        "While loading, the paging buttons are disabled and the table is marked busy. You supply what shows when it is empty or fails.",
      ],
    ],
  },
  timeline: {
    useWhen: [
      [
        "يريد المستخدم أن يتتبع ما جرى لطلب أو فاتورة أو حساب عبر الوقت.",
        "Someone wants to follow what happened to an order, an invoice or an account over time.",
      ],
    ],
    instead: [
      {
        text: [
          "تعرض مراحل عملية لم تكتمل بعد، فاستخدم",
          "You are showing the stages of a process that isn't finished, so use",
        ],
        page: "steps",
      },
      {
        text: [
          "تعرض مهام الوكيل وحالات تنفيذها، فاستخدم",
          "You are showing an agent's tasks and their states, so use",
        ],
        page: "task-rows",
      },
    ],
    notice: [
      [
        "في RTL يتغيّر موضع العرض فقط، أما ترتيب الأحداث فيبقى كما مرّرته.",
        "In RTL only the layout changes. The events keep the order you passed.",
      ],
      [
        "نسّق التاريخ بلغة المستخدم في تطبيقك، ومرّر dateTime صالحًا ليُكتب عنصر time.",
        "Format the date in the user's language in your app, and pass a valid dateTime so it is written as a time element.",
      ],
    ],
  },

  // Display & feedback
  "notification-list": {
    useWhen: [
      [
        "يفتح المستخدم مركز الإشعارات ليرى ما فاته ويعلّم ما قرأه.",
        "Someone opens a notification center to see what they missed and mark what they have read.",
      ],
    ],
    instead: [
      {
        text: [
          "تريد رسالة عابرة تختفي وحدها بعد إجراء، فاستخدم",
          "You want a passing message that disappears on its own after an action, so use",
        ],
        page: "toast",
      },
      {
        text: [
          "تعرض رسالة ثابتة داخل الصفحة، فاستخدم",
          "You want a message that stays in the page, so use",
        ],
        page: "alert",
      },
    ],
    notice: [
      [
        "فتح إجراء الإشعار لا يعلّمه كمقروء. التعليم خطوة صريحة من المستخدم أو من تطبيقك.",
        "Opening a notification's action does not mark it as read. That is a separate step, taken by the person or by your app.",
      ],
      [
        "الحالة مكتوبة لا نقطة فقط، ويتعطّل «تعليم الكل كمقروء» حين لا يبقى إشعار غير مقروء.",
        "Unread status is written, not only a dot, and “Mark all as read” disables when nothing is unread.",
      ],
    ],
  },
  card: {
    useWhen: [
      [
        "تجمع معلومات مترابطة، كملخص عميل أو إعداد، في وحدة واحدة على الصفحة.",
        "You group related information, such as a customer summary or a setting, as one unit on the page.",
      ],
    ],
    instead: [
      {
        text: [
          "يجب أن تُنقر البطاقة كلها لتنفّذ إجراءً، فاستخدم",
          "The whole thing should be clickable to act, so use",
        ],
        page: "button",
      },
      {
        text: [
          "تعرض نتائج يتصفحها المستخدم واحدة واحدة، فاستخدم",
          "You show findings that people browse one at a time, so use",
        ],
        page: "insight-cards",
      },
    ],
    notice: [
      [
        "البطاقة سطح للقراءة، فلا تأخذ التركيز ولا تدعم النقر على كامل سطحها. ضع الإجراءات في الرأس أو التذييل.",
        "A card is a surface to read, so it takes no focus and can't be clicked as a whole. Put actions in the header or footer.",
      ],
    ],
  },
  accordion: {
    useWhen: [
      [
        "تعرض أسئلة شائعة أو إعدادات متقدمة لا يحتاجها كل مستخدم.",
        "You show common questions or advanced settings that not everyone needs.",
      ],
    ],
    instead: [
      {
        text: [
          "يبدّل المستخدم بين عروض متوازية بسرعة، فاستخدم",
          "People switch between parallel views quickly, so use",
        ],
        page: "tabs",
      },
    ],
    notice: [
      [
        "افتراضيًا لا يغلق الضغط على العنوان القسم المفتوح نفسه. فعّل collapsible ليغلقه المستخدم.",
        "By default pressing the open section's own heading does not close it. Turn on collapsible to let people close it.",
      ],
      [
        "تتنقل الأسهم بين العناوين، ويفتح Enter أو Space القسم، ويتوقف القسم المغلق عن الاستجابة فور إغلاقه حتى أثناء حركته.",
        "Arrow keys move between headings and Enter or Space opens a section. A closing section stops responding at once, even mid-animation.",
      ],
    ],
  },
  avatar: {
    useWhen: [
      [
        "تعرّف المستخدم بمن كتب أو عدّل أو أُسندت إليه مهمة.",
        "You show who wrote, edited or was assigned something.",
      ],
    ],
    instead: [
      {
        text: [
          "تعرض عدة أشخاص معًا، فاستخدم",
          "You show several people together, so use",
        ],
        page: "avatar-group",
      },
      {
        text: [
          "تعرض حالة لا شخصًا، فاستخدم",
          "You show a status, not a person, so use",
        ],
        page: "badge",
      },
    ],
    notice: [
      [
        "يُعلَن الاسم لقارئ الشاشة مرة واحدة، والصورة للزينة. وإن غابت الصورة أو تعذّر تحميلها ظهرت الأحرف الأولى من الاسم، أو ما تمرّره في fallback.",
        "The name is announced once and the picture is decoration. If the picture is missing or fails to load, the name's initials show instead, or whatever you pass as fallback.",
      ],
      [
        "إن جاور الصورة نص يؤدي المعنى نفسه فاجعلها زخرفية لئلا يُقرأ الاسم مرتين.",
        "If text beside it already says the same name, mark the avatar decorative so it isn't read twice.",
      ],
    ],
  },
  "avatar-group": {
    useWhen: [
      [
        "تعرض أعضاء فريق أو مشاركين في مهمة ولا يتسع المكان لهم جميعًا.",
        "You show the members of a team or the people on a task, and there is not room for all of them.",
      ],
    ],
    instead: [
      {
        text: [
          "يهمّ المستخدم شخص واحد، فاستخدم",
          "Only one person matters, so use",
        ],
        page: "avatar",
      },
      {
        text: [
          "يحتاج المستخدم إلى فتح قائمة الباقين بأسمائهم، فاستخدم",
          "People need to open the list of the rest by name, so use",
        ],
        page: "dropdown",
      },
    ],
    notice: [
      [
        "يقرأ قارئ الشاشة أسماء الأعضاء المخفيين مع العدد الزائد، وهو نص لا زر، فلا يفتح قائمة.",
        "A screen reader reads the hidden members' names with the extra count. The count is text, not a button, so it opens no list.",
      ],
      [
        "يظهر العدد الزائد بحسب إعداد الأرقام، عربيًا أو لاتينيًا.",
        "The overflow count follows the numerals setting, Arabic or Latin.",
      ],
    ],
  },
  badge: {
    useWhen: [
      [
        "تضع بجانب عنصر كلمة قصيرة عن حالته، كمدفوع أو متأخر أو جديد.",
        "You label an item with a short word about its status, such as paid, overdue or new.",
      ],
    ],
    instead: [
      {
        text: [
          "تريد رسالة تشرح وتطلب إجراءً، فاستخدم",
          "You want a message that explains and asks for action, so use",
        ],
        page: "alert",
      },
      {
        text: [
          "يجب أن ينقر المستخدم ليفعل شيئًا، فاستخدم",
          "People must click to do something, so use",
        ],
        page: "button",
      },
    ],
    notice: [
      [
        "النص هو الذي يحمل المعنى واللون يؤكّده فقط. ولا تجعل الشارة زرًا.",
        "The text carries the meaning and color only reinforces it. Do not turn a badge into a button.",
      ],
    ],
  },
  "empty-state": {
    useWhen: [
      [
        "لا يوجد في القائمة أو الجدول شيء بعد، أو لا يجد البحث نتيجة.",
        "A list or table has nothing in it yet, or a search finds nothing.",
      ],
    ],
    instead: [
      {
        text: [
          "المحتوى قيد التحميل وليس فارغًا، فاستخدم",
          "The content is still loading, not empty, so use",
        ],
        page: "skeleton",
      },
      {
        text: [
          "تُبلغ المستخدم بمشكلة حدثت، فاستخدم",
          "You are telling people about a problem, so use",
        ],
        page: "alert",
      },
    ],
    notice: [
      [
        "الرسم للزينة ومخفي عن قارئ الشاشة، فاكتب في العنوان والوصف ما يحتاجه المستخدم.",
        "The artwork is decoration and hidden from screen readers, so put what people need in the title and description.",
      ],
      [
        "اربط الإجراء بنتيجة فعلية، كإضافة أول عنصر.",
        "Connect the action to a real result, such as adding the first item.",
      ],
    ],
  },
  alert: {
    useWhen: [
      [
        "تخبر المستخدم بما يجب أن يبقى أمامه، كاقتراب انتهاء الاشتراك أو مشكلة في نموذج.",
        "You tell people something that must stay in view, such as a subscription about to end or a problem in a form.",
      ],
    ],
    instead: [
      {
        text: [
          "تُبلغ بنتيجة عابرة تختفي وحدها، فاستخدم",
          "You are reporting a passing result that can disappear on its own, so use",
        ],
        page: "toast",
      },
      {
        text: [
          "يحتاج المستخدم إلى قرار قبل أن يتابع، فاستخدم",
          "People need to decide before they continue, so use",
        ],
        page: "modal",
      },
    ],
    notice: [
      [
        "لا تُعلَن الرسالة الثابتة لقارئ الشاشة افتراضيًا. استخدم polite للتحديثات العادية، وassertive للعاجلة فقط.",
        "A static alert is not announced by default. Use polite for ordinary updates and assertive only for urgent ones.",
      ],
      [
        "ألوان الحالة دلالية ولا تتغيّر مع اللون الأساسي للنظام.",
        "Tone colors are semantic and do not change with the system accent.",
      ],
    ],
  },
  toast: {
    useWhen: [
      [
        "ينفّذ المستخدم إجراءً وتريد تأكيدًا قصيرًا لا يقطع عمله، مثل «حُفظت الفاتورة».",
        "Someone does something and you want a short confirmation that doesn't interrupt them, like “Invoice saved”.",
      ],
    ],
    instead: [
      {
        text: [
          "تحتاج رسالة تبقى حتى يعالجها المستخدم، فاستخدم",
          "You need a message that stays until the person deals with it, so use",
        ],
        page: "alert",
      },
      {
        text: [
          "يحتاج المستخدم إلى اتخاذ قرار، فاستخدم",
          "People need to make a decision, so use",
        ],
        page: "modal",
      },
    ],
    notice: [
      [
        "يتوقف العدّ التنازلي عند المرور أو التركيز، ولا يظهر أكثر من ثلاثة تنبيهات معًا، فيُسقَط الأقدم.",
        "The countdown pauses on hover or focus. No more than three toasts show together, and the oldest is dropped.",
      ],
      [
        "ينقل F8 التركيز إلى التنبيهات، ويُغلق كل تنبيه يدويًا أو بسحبه إلى الأسفل.",
        "F8 moves focus to the toasts, and each one can be closed by hand or swiped down.",
      ],
    ],
  },
  skeleton: {
    useWhen: [
      [
        "تعرف شكل المحتوى القادم، كقائمة أو بطاقة، ولا تريد أن تقفز الصفحة حين يصل.",
        "You know the shape of what is coming, such as a list or a card, and don't want the page to jump when it arrives.",
      ],
    ],
    instead: [
      {
        text: [
          "لا تعرف الشكل وتحتاج إلى تسمية، فاستخدم",
          "You don't know the shape and need a label, so use",
        ],
        page: "loading-state",
      },
      {
        text: [
          "تعرف مقدار ما أُنجز، فاستخدم",
          "You know how much is done, so use",
        ],
        page: "progress",
      },
    ],
    notice: [
      [
        "الهيكل للزينة دائمًا ولا يعلن شيئًا، فيعلن تطبيقك التحميل بنفسه.",
        "A skeleton is always decoration and announces nothing, so your app announces the loading itself.",
      ],
      [
        "تتوقف حركته مع تقليل الحركة.",
        "Its shimmer stops with reduced motion.",
      ],
    ],
  },
  progress: {
    useWhen: [
      [
        "ينتظر المستخدم رفع ملف أو إنجاز مهمة وتعرف مقدار ما أُنجز.",
        "Someone waits on an upload or a job and you know how much is done.",
      ],
    ],
    instead: [
      {
        text: [
          "تحتاج مؤشرًا صغيرًا بجوار نص، فاستخدم",
          "You need a small indicator beside some text, so use",
        ],
        page: "spinner",
      },
      {
        text: [
          "تحتاج تسمية ووصفًا ظاهرين أثناء الانتظار، فاستخدم",
          "You need a visible label and description while people wait, so use",
        ],
        page: "loading-state",
      },
    ],
    notice: [
      [
        "تُحصر القيمة بين ٠ و١٠٠، ومع null لا تُعلن أي نسبة.",
        "The value is clamped between 0 and 100, and with null no percentage is announced.",
      ],
      [
        "لا تظهر النسبة مكتوبة إلا مع showValue، وتتبع أرقامها في العربية إعداد الأرقام.",
        "The percentage is written out only with showValue, and in Arabic its digits follow the numerals setting.",
      ],
    ],
  },
  spinner: {
    useWhen: [
      [
        "يضغط المستخدم زرًا أو يحدّث قائمة وتريد علامة انتظار صغيرة في موضع الحدث.",
        "Someone presses a button or refreshes a list, and you want a small waiting sign right where it happens.",
      ],
    ],
    instead: [
      {
        text: [
          "تعرف مقدار ما أُنجز، فاستخدم",
          "You know how much is done, so use",
        ],
        page: "progress",
      },
      {
        text: [
          "تحتاج تسمية ووصفًا ظاهرين، فاستخدم",
          "You need a visible label and description, so use",
        ],
        page: "loading-state",
      },
    ],
    notice: [
      [
        "اكتب label لكل مؤشر يقف وحده. وحين يجاوره نص يقول الشيء نفسه فاجعله decorative كي لا يُقرأ مرتين.",
        "Give every stand-alone spinner a label. When text beside it says the same thing, mark it decorative so it isn't read twice.",
      ],
      [
        "مع تقليل الحركة يتوقف الدوران ويبقى المؤشر والتسمية.",
        "With reduced motion it stops spinning, and the indicator and label stay.",
      ],
    ],
  },

  // Overlays
  dropdown: {
    useWhen: [
      [
        "يحتاج المستخدم إلى عدة إجراءات على عنصر واحد، كتعديل ونسخ وحذف، دون ازدحام الصفحة.",
        "Someone needs several actions on one item, such as edit, duplicate and delete, without crowding the page.",
      ],
    ],
    instead: [
      {
        text: [
          "يختار المستخدم قيمة تُحفظ في نموذج، فاستخدم",
          "People choose a value to save in a form, so use",
        ],
        page: "select",
      },
      {
        text: [
          "يبدّل المستخدم بين عروض مرتبطة، فاستخدم",
          "People switch between related views, so use",
        ],
        page: "tabs",
      },
    ],
    notice: [
      [
        "لا قوائم فرعية، والاختصار المكتوب بجانب الأمر وصف فقط ولا يفعّل شيئًا.",
        "There are no submenus. A shortcut written beside an item is only a label and registers nothing.",
      ],
      [
        "تنقل الكتابة التركيز إلى العنصر المطابق، ويغلق Tab القائمة بدل أن يتنقل داخلها.",
        "Typing jumps to a matching item, and Tab closes the menu rather than moving through it.",
      ],
    ],
  },
  sheet: {
    useWhen: [
      [
        "يراجع المستخدم سجلات في جدول، ويفتح أحدها ليعدّله ثم يعود إلى موضعه.",
        "Someone works through records in a table, opens one to edit it, then carries on from the same spot.",
      ],
    ],
    instead: [
      {
        text: [
          "المهمة قصيرة وتتطلب انتباه المستخدم كله في وسط الشاشة، فاستخدم",
          "The task is short and deserves the person's full attention in the middle of the screen, so use",
        ],
        page: "modal",
      },
      {
        text: [
          "تعرض بضعة أوامر فقط، فاستخدم",
          "You are offering just a few commands, so use",
        ],
        page: "dropdown",
      },
    ],
    notice: [
      [
        "تفتح اللوحة على اليمين في RTL وعلى اليسار في LTR ما لم تحدّد side.",
        "The sheet opens on the right in RTL and on the left in LTR unless you set side.",
      ],
      [
        "العنوان والوصف وتسمية زر الإغلاق مطلوبة، ويعيد الإغلاق التركيز إلى الزر الذي فتحها.",
        "A title, a description and a close label are required. Closing returns focus to the button that opened the sheet.",
      ],
    ],
  },
  modal: {
    useWhen: [
      [
        "يجب أن يقرّر المستخدم أو يُنهي خطوة واحدة قبل أن يتابع، كتأكيد حذف أو إدخال اسم.",
        "Someone must decide or finish one step before going on, such as confirming a deletion or entering a name.",
      ],
    ],
    instead: [
      {
        text: [
          "تعرض تفاصيل يستطيع المستخدم تجاهلها لحظة، فاستخدم",
          "You show details that people can set aside for a moment, so use",
        ],
        page: "sheet",
      },
      {
        text: [
          "تخبر المستخدم بشيء لا يتطلب قرارًا، فاستخدم",
          "You are telling people something that needs no decision, so use",
        ],
        page: "alert",
      },
    ],
    notice: [
      [
        "يبقى Tab داخل النافذة، ويغلقها Escape أو النقر خارجها، ويعود التركيز إلى الزر الذي فتحها.",
        "Tab stays inside the dialog. Escape or a click outside closes it, and focus returns to the button that opened it.",
      ],
      [
        "تبقى القوائم والتلميحات التي تُفتح داخل النافذة ضمن حدودها، ولا تُفتح أكثر من نافذة معًا.",
        "Menus and tooltips opened inside it stay within it, and only one dialog can be open at a time.",
      ],
    ],
  },
  tooltip: {
    useWhen: [
      [
        "يحتاج زر بأيقونة وحدها إلى اسم، أو يحتاج اختصار إلى شرح من كلمات قليلة.",
        "A button with only an icon needs a name, or a shortcut needs a few words of explanation.",
      ],
    ],
    instead: [
      {
        text: [
          "المعلومة طويلة وتحتاج إلى قراءة متأنية، فاستخدم",
          "The information is long and needs careful reading, so use",
        ],
        page: "sheet",
      },
      {
        text: [
          "يحتاج المحتوى إلى أزرار أو روابط، فاستخدم",
          "The content needs buttons or links, so use",
        ],
        page: "dropdown",
      },
    ],
    notice: [
      [
        "يظهر فور التركيز، وبعد نصف ثانية عند المرور، ويغلقه Escape أو مغادرة العنصر.",
        "It shows at once on focus and after half a second on hover. Escape or leaving the element closes it.",
      ],
      [
        "المحتوى نص قصير غير تفاعلي فقط، فلا تضع فيه أزرارًا أو روابط.",
        "The content is short, non-interactive text only, so put no buttons or links in it.",
      ],
    ],
  },

  // Charts
  "line-chart": {
    useWhen: [
      [
        "يريد المستخدم أن يعرف هل ترتفع الإيرادات أم تنخفض خلال الأشهر الماضية.",
        "Someone wants to know whether revenue has been rising or falling over recent months.",
      ],
    ],
    instead: [
      {
        text: [
          "تقارن بين فئات لا تسلسل زمنيًا بينها، فاستخدم",
          "You compare categories that have no time order, so use",
        ],
        page: "bar-chart",
      },
      {
        text: [
          "تريد إبراز حجم القيمة تحت الخط، فاستخدم",
          "You want the size of the value to stand out under the line, so use",
        ],
        page: "area-chart",
      },
    ],
    notice: [
      [
        "لا ينعكس الزمن في RTL: تبقى النقاط بترتيب بياناتك، من اليسار إلى اليمين.",
        "Time does not flip in RTL. Points stay in the order you pass them, from left to right.",
      ],
      [
        "يصل مستخدم لوحة المفاتيح إلى الرسم بـ Tab ثم يتنقّل بين النقاط بالأسهم. اكتب ملخصًا يصف الرسم لمن لا يراه.",
        "Keyboard users reach the chart with Tab and move between points with the arrow keys. Write a summary for anyone who can't see it.",
      ],
    ],
  },
  "area-chart": {
    useWhen: [
      [
        "تريد أن يرى المستخدم حجم القيمة لا اتجاهها فقط، كإجمالي المبيعات الشهرية.",
        "You want people to see the size of a value, not just its direction, such as total monthly sales.",
      ],
    ],
    instead: [
      {
        text: [
          "تقارن عدة سلاسل متقاربة تحجب مساحاتها بعضها، فاستخدم",
          "Several close series would hide each other under their fills, so use",
        ],
        page: "line-chart",
      },
      {
        text: [
          "تقارن بين فئات لا زمن بينها، فاستخدم",
          "You compare categories that have no time order, so use",
        ],
        page: "bar-chart",
      },
    ],
    notice: [
      [
        "مع legend يصبح كل عنصر في مفتاح الرسم زرًا يخفي سلسلته أو يُظهرها، ما لم تعطّل interactiveLegend. ويبقى الجدول الاختياري كاملًا.",
        "With legend on, each legend item is a button that hides or shows its series unless you turn interactiveLegend off. The optional table still lists every value.",
      ],
      [
        "تتكرر الألوان الافتراضية بعد أربع سلاسل، فحدّد ألوانًا مقصودة لما زاد عليها.",
        "Default colors repeat after four series, so set your own colors for any beyond that.",
      ],
    ],
  },
  "bar-chart": {
    useWhen: [
      [
        "يريد المستخدم أن يرى أي فرع أو شهر أعلى من غيره.",
        "Someone wants to see which branch or month is higher than the rest.",
      ],
    ],
    instead: [
      {
        text: [
          "تريد اتجاهًا متصلًا عبر الزمن، فاستخدم",
          "You want a continuous trend over time, so use",
        ],
        page: "line-chart",
      },
      {
        text: [
          "تريد حصة كل جزء من الكل، فاستخدم",
          "You want each part's share of a whole, so use",
        ],
        page: "donut-chart",
      },
    ],
    notice: [
      [
        "تُرسم الفئات من اليسار إلى اليمين بالترتيب الذي تمرّره، حتى في RTL، فرتّب بياناتك على هذا الأساس.",
        "Categories are drawn left to right in the order you pass, in RTL too, so order your data with that in mind.",
      ],
      [
        "حين تضع رسمين متجاورين، أعد استخدام ترتيب السلاسل وألوانها نفسها ليحتفظ كل لون بمعناه.",
        "When charts sit side by side, reuse the same series order and colors so each color keeps its meaning.",
      ],
    ],
  },
  "donut-chart": {
    useWhen: [
      [
        "يريد المستخدم أن يعرف أي مصدر يساهم بالنصيب الأكبر في إجمالي الإيراد.",
        "Someone wants to know which source contributes the largest share of the total revenue.",
      ],
    ],
    instead: [
      {
        text: [
          "تقارن بين أجزاء كثيرة أو تحتاج إلى قيم دقيقة، فاستخدم",
          "You compare many parts or need exact values, so use",
        ],
        page: "bar-chart",
      },
      {
        text: [
          "تعرض كيف يتغيّر التوزيع عبر الزمن، فاستخدم",
          "You are showing how the split changes over time, so use",
        ],
        page: "line-chart",
      },
    ],
    notice: [
      [
        "يرسم الرسم الحلقي القيم الموجبة فقط، وتبقى القيم الصفرية أو السالبة أو المفقودة في الجدول الاختياري.",
        "Only positive values are drawn. Zero, negative and missing entries stay in the optional table.",
      ],
      [
        "يصل مستخدم لوحة المفاتيح إلى الرسم بـ Tab ثم يتنقّل بين الشرائح بالأسهم.",
        "Keyboard users reach the chart with Tab, then move between slices with the arrow keys.",
      ],
    ],
  },
};
