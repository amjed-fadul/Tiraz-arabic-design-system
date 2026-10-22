# Tiraz Arabic voice

Tiraz is written in Arabic first, not translated into it. Arabic copy should
read like a careful Arab product writer wrote it for a person, never like an
English spec run through a translator. When English and Arabic disagree, the
Arabic stays natural and the English follows its meaning, not its words.

## The voice

- **Talk to the reader.** Docs address the developer directly ("اعرض…",
  "مرّر…"); component text addresses the end user. Never describe the system
  to itself ("يزوّدها التطبيق"، "التطبيق يملك").
- **Lead with a verb.** Descriptions start with what the thing does for
  someone: «يعرض الأوامر ومخرجاتها للقراءة فقط.» not «عرض للقراءة فقط لأوامر
  ومخرجات يزوّدها التطبيق.»
- **Whole sentences, short.** One idea per sentence, joined with «و» or «ثم».
  No telegraphic noun piles («قيم يزوّدها التطبيق؛ لا تنفيذ أو قياس للوقت.»)
  and no chains of semicolons.
- **Warm and calm.** Confident, plain, never cute. No exclamation marks, no
  hedging with «قد» when the behavior is certain.
- **Concrete over abstract.** Say what happens: «تبقى مسودتك كما هي» rather
  than «الحفاظ على المسودة».

## Phrases to avoid → what to write instead

| Robotic                                | Natural                                   |
| -------------------------------------- | ----------------------------------------- |
| يزوّدها التطبيق / يملكها التطبيق       | من تطبيقك / تمرّرها أنت / يتولّاها تطبيقك |
| مسؤولية التطبيق                        | يتولّاها تطبيقك                           |
| يتم + مصدر (يتم حفظ الملف)             | فعل مباشر (يُحفظ الملف / نحفظ الملف)      |
| قابل لـ + مصدر (قابلة للتوسيع)         | فعل (تنفتح لعرض التفاصيل)                 |
| بشكل + صفة (بشكل مستقل، بشكل صحيح)     | حال أو صفة مباشرة (وحدها، كما ينبغي)      |
| الخاص بـ                               | إضافة مباشرة (إعدادات الحساب)             |
| متحكَّم به / غير متحكَّم به (in prose) | يدير تطبيقك قيمته / يدير المكوّن قيمته    |
| تحديد كمقروءة                          | تعليم كمقروءة                             |
| اذهب إلى الشهر السابق                  | الشهر السابق                              |
| من فضلك قم بإدخال…                     | أدخل…                                     |
| عملية ناجحة                            | فعل ماضٍ يقول ما حدث (حُفظت الفاتورة)     |

Short status words that Arabic interfaces already use are fine: «تم النسخ»،
«جارٍ التحميل…»، «حاول مرة أخرى».

## Messages

- **Errors** say what happened, then what to do, with no blame:
  «تعذّر الإرسال. مسودتك محفوظة، حاول مرة أخرى.»
- **Empty states** say what will appear and how to start:
  «لا توجد مهام بعد. ستظهر هنا حين يبدأ الوكيل العمل.»
- **Progress** uses «جارٍ…» with an ellipsis: «جارٍ تجهيز التقرير…».
- **Success** states the result in the past tense: «أُرسلت الإجابات».
- **Buttons** are short imperatives or nouns: «إرسال»، «حفظ»، «إلغاء»، «نسخ».

## Punctuation and numbers

- Arabic marks in Arabic text: «،» «؛» «؟» and quotes «…». No space before a
  mark, one space after it.
- Ellipsis is one character «…».
- Numbers in Arabic interface text go through `numberLocale(config)`:
  Arabic-Indic digits (٠١٢٣) by default, Western digits (0123) when the host
  sets `numerals: "latn"`. Digit key hints, such as the 1–9 of
  AskUserQuestions, follow the same setting, because Arabic keyboards type
  ١–٩ on the number row and both digit sets are accepted. Latin digits stay
  in code, identifiers, units in code (`14px`), SKUs and key _names_ such as
  Enter or Ctrl.
- Code names, props and file paths stay in Latin script inside the sentence;
  do not translate `onValueChange` or `src/system`.

## Glossary

| English           | Arabic                         | Notes                                  |
| ----------------- | ------------------------------ | -------------------------------------- |
| component         | المكوّن / المكوّنات            | always with the shadda                 |
| design system     | نظام التصميم                   |                                        |
| playground        | المعاينة                       |                                        |
| example           | مثال / أمثلة                   |                                        |
| prop              | خاصية / الخصائص                |                                        |
| API reference     | دليل الخصائص                   |                                        |
| customization     | التخصيص                        |                                        |
| code              | الكود                          | what Arab developers say               |
| agent prompt      | الطلب                          | «نسخ الطلب»                            |
| agent             | الوكيل                         |                                        |
| assistant         | المساعد                        |                                        |
| model (AI)        | النموذج                        |                                        |
| tool call         | استدعاء أداة                   |                                        |
| streaming         | يصل الرد تباعًا                | describe it; avoid «التدفق» in UI text |
| source / citation | المصدر / الإشارة إلى المصدر    |                                        |
| approve / reject  | موافقة / رفض                   |                                        |
| controlled        | يدير تطبيقك القيمة             | keep `value`/`onValueChange` in code   |
| uncontrolled      | يدير المكوّن القيمة            |                                        |
| event             | حدث                            |                                        |
| accent color      | اللون الأساسي                  |                                        |
| density           | الكثافة: مدمجة / مريحة         |                                        |
| reduce motion     | تقليل الحركة                   |                                        |
| mark as read      | تعليم كمقروءة                  |                                        |
| dismiss           | إغلاق                          |                                        |
| retry             | حاول مرة أخرى / إعادة المحاولة | sentence / button                      |

## Sample content

Demo data is real-sounding Gulf and Levant business content: «شركة مدار
للتقنية»، «مقهى نخلة»، «فاتورة أكتوبر». Names are ordinary («سارة العتيبي»،
«عمر الحربي»). No lorem ipsum, no «نص تجريبي».
