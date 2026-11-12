import type { ActivityEvent, ComposerActivity } from "./activity-runtime";

export interface WorkspaceRun {
  runId: string;
  request: string;
  model: string;
  effort: number;
}

type Copy = [string, string];
type Activity = Omit<ComposerActivity, "sequence" | "startedAt" | "endedAt">;

/**
 * LOCAL FIXTURE ONLY. No model, network, files or agents are contacted.
 * Khayt plans for a moment, then three agents each do one thing: the explorer
 * traces the flow, the analyst reads the test notes alongside it, and the
 * reviewer starts once both report.
 */
export function startWorkspaceDemo(
  run: WorkspaceRun,
  send: (event: ActivityEvent) => void,
) {
  // A real host stamps each event when it observes it.
  const emit = (event: ActivityEvent) => send({ ...event, at: Date.now() });
  let sequence = 0;
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const activity = (item: Activity) => {
    if (!cancelled)
      emit({
        type: "activity.changed",
        runId: run.runId,
        sequence: ++sequence,
        activity: item,
      });
  };
  // Khayt reads the request and plans before any agent starts.
  const planning = 2500;
  const later = (ms: number, action: () => void) =>
    timers.push(
      setTimeout(() => {
        if (!cancelled) action();
      }, planning + ms),
    );
  const explorer = {
    id: "explore",
    panel: "agent-0" as const,
    label: ["تتبّع خطوات التسجيل", "Trace the signup steps"] as Copy,
  };
  const analyst = {
    id: "analyse",
    panel: "agent-1" as const,
    label: ["قراءة ملاحظات الاختبار", "Read the test notes"] as Copy,
  };
  const reviewer = {
    id: "review",
    panel: "agent-2" as const,
    label: [
      "فحص طريق العودة وصياغة التوصيات",
      "Check recovery and recommend",
    ] as Copy,
  };
  const reading = {
    id: "reading",
    panel: "folders" as const,
    label: ["قراءة مسار التسجيل", "Reading the signup flow"] as Copy,
  };
  const research = {
    id: "research",
    panel: "research" as const,
    label: ["مقارنة ملاحظات الاختبار", "Comparing the test notes"] as Copy,
  };
  const checks = {
    id: "checks",
    panel: "skills" as const,
    label: ["فحص مسار العودة", "Checking the recovery path"] as Copy,
  };

  const flow = {
    id: "flow",
    title: ["خطوات التسجيل", "Signup steps"] as Copy,
    detail: [
      "بعد إنشاء الحساب يُرسَل رابط التأكيد، لكن الشاشة لا تذكر ذلك.",
      "A confirmation link is sent after the account is created, but the screen never says so.",
    ] as Copy,
  };
  const recovery = {
    id: "recovery",
    title: ["الرجوع لتصحيح البريد", "Going back to fix the email"] as Copy,
    detail: [
      "الرجوع إلى الخطوة السابقة يمسح ما أُدخل.",
      "Going back a step clears everything already entered.",
    ] as Copy,
  };
  const notes = {
    id: "notes",
    title: ["ملاحظات جلسات الاختبار", "Test-session notes"] as Copy,
    detail: [
      "انتظر المشاركون التأكيد داخل التطبيق، ولم يعرفوا أن عليهم فتح بريدهم.",
      "Participants waited for confirmation inside the app and didn’t know to open their email.",
    ] as Copy,
  };
  const brief = {
    id: "brief",
    title: ["ملخص البحث", "Research summary"] as Copy,
    detail: [
      "سمِّ الخطوة التالية، واعرض إعادة الإرسال إذا تأخّرت الرسالة.",
      "Name the next step, and offer resend when the message is late.",
    ] as Copy,
  };
  const next = {
    id: "next",
    title: ["الخطوة التالية · غير واضحة", "Next step · unclear"] as Copy,
    detail: [
      "لا تطلب الشاشة من المستخدم فتح بريده.",
      "The screen doesn’t ask the person to open their email.",
    ] as Copy,
  };
  const input = {
    id: "input",
    title: ["المدخلات · تُمسح", "Entered details · cleared"] as Copy,
    detail: [
      "الرجوع لتصحيح البريد يمسح ما أُدخل من قبل.",
      "Going back to fix the email clears what was entered.",
    ] as Copy,
  };
  const resend = {
    id: "resend",
    title: ["إعادة الإرسال · غير متاحة", "Resend · missing"] as Copy,
    detail: [
      "لا تتيح شاشة الانتظار طلب رابط جديد.",
      "The waiting screen offers no way to get a new link.",
    ] as Copy,
  };
  const checking: Copy = [
    "يتحقق من وضوح الخطوة التالية وحفظ المدخلات وإعادة الإرسال.",
    "Checking next-step clarity, kept input and resend.",
  ];

  // About 26 seconds: a short plan, then the agents start one after another,
  // report what they are doing along the way, and evidence arrives item by item.
  emit({ type: "run.started", runId: run.runId, sequence: ++sequence });
  later(0, () =>
    activity({
      ...explorer,
      status: "running",
      detail: [
        "يفتح شاشة إنشاء الحساب.",
        "Opening the account creation screen.",
      ],
    }),
  );
  later(400, () =>
    activity({
      ...reading,
      status: "running",
      detail: [
        "يقرأ شاشات التسجيل في مواد العيّنة.",
        "Reading the signup screens in the sample material.",
      ],
    }),
  );
  later(800, () =>
    activity({
      ...analyst,
      status: "running",
      detail: [
        "يقرأ ملاحظات الجلسة الأولى.",
        "Reading the notes from the first session.",
      ],
    }),
  );
  later(1200, () =>
    activity({
      ...research,
      status: "running",
      detail: [
        "يجمع ما لاحظه المشاركون عند انتظار التأكيد.",
        "Gathering what participants did while waiting for confirmation.",
      ],
    }),
  );
  later(3000, () => {
    activity({
      ...explorer,
      status: "running",
      detail: [
        "يتتبّع رسالة التأكيد بعد إنشاء الحساب.",
        "Following the confirmation email after signup.",
      ],
    });
    activity({
      ...reading,
      status: "running",
      detail: [
        "يقرأ شاشات التسجيل في مواد العيّنة.",
        "Reading the signup screens in the sample material.",
      ],
      evidence: [flow],
    });
  });
  later(4500, () =>
    activity({
      ...analyst,
      status: "running",
      detail: [
        "يقارن ما حدث في الجلسات الخمس.",
        "Comparing what happened across the five sessions.",
      ],
    }),
  );
  later(6000, () => {
    activity({
      ...reading,
      status: "complete",
      detail: [
        "قُرئت شاشات التسجيل وطريق العودة.",
        "Signup screens and the way back reviewed.",
      ],
      evidence: [flow, recovery],
    });
    activity({
      ...explorer,
      status: "complete",
      detail: ["رسم المسار في أربع خطوات.", "Mapped the flow in four steps."],
    });
  });
  later(7000, () =>
    activity({
      ...research,
      status: "running",
      detail: [
        "يجمع ما لاحظه المشاركون عند انتظار التأكيد.",
        "Gathering what participants did while waiting for confirmation.",
      ],
      evidence: [notes],
    }),
  );
  later(10_000, () => {
    activity({
      ...research,
      status: "complete",
      detail: [
        "الملاحظات تشير إلى خطوة تأكيد غير واضحة.",
        "The notes point to an unclear confirmation step.",
      ],
      evidence: [notes, brief],
    });
    activity({
      ...analyst,
      status: "complete",
      detail: [
        "وجد موضعين يتعثّر فيهما المشاركون.",
        "Found two places where participants get stuck.",
      ],
    });
    activity({
      ...reviewer,
      status: "running",
      detail: [
        "يفحص طريق العودة لتصحيح البريد.",
        "Checking the way back to fix an email.",
      ],
    });
  });
  later(10_400, () =>
    activity({ ...checks, status: "running", detail: checking }),
  );
  later(13_000, () => {
    activity({
      ...checks,
      status: "running",
      detail: checking,
      evidence: [next],
    });
    activity({
      ...reviewer,
      status: "running",
      detail: [
        "يتحقق من حفظ ما أدخله المستخدم.",
        "Checking that entered details are kept.",
      ],
    });
  });
  later(15_500, () => {
    activity({
      ...checks,
      status: "running",
      detail: checking,
      evidence: [next, input],
    });
    activity({
      ...reviewer,
      status: "running",
      detail: [
        "يبحث عن طريقة لطلب رابط جديد.",
        "Looking for a way to request a new link.",
      ],
    });
  });
  later(18_000, () => {
    activity({
      ...checks,
      status: "complete",
      detail: [
        "ثلاثة مواضع تحتاج إصلاحًا قبل الإطلاق.",
        "Three things to fix before launch.",
      ],
      evidence: [next, input, resend],
    });
    activity({
      ...reviewer,
      status: "running",
      detail: [
        "يرتّب التوصيات حسب أثرها.",
        "Ranking the recommendations by impact.",
      ],
    });
  });
  later(21_000, () =>
    activity({
      ...reviewer,
      status: "running",
      detail: [
        "يصوغ التوصيات الثلاث.",
        "Writing up the three recommendations.",
      ],
    }),
  );
  later(24_000, () => {
    activity({
      ...reviewer,
      status: "complete",
      detail: [
        "ثلاث توصيات جاهزة في الرد.",
        "Three recommendations are ready in the reply.",
      ],
    });
    emit({
      type: "run.finished",
      runId: run.runId,
      sequence: ++sequence,
      status: "complete",
    });
  });
  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };
}
