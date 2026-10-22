import type { ImageGenerationLabels } from "./ImageGeneration";

// Image generation's built-in words. The pattern picks a set by direction and
// merges its `labels` over it. They live here because a component file that
// exports anything but components breaks fast refresh. The pill and the
// announcements agree with الصورة (feminine), as the spec gives them.

export const imageGenerationCopy: {
  ar: ImageGenerationLabels;
  en: ImageGenerationLabels;
} = {
  ar: {
    title: "توليد صورة",
    queued: "في الانتظار",
    weaving: "يُنسج",
    completed: "جاهزة",
    failedPill: "تعثّرت",
    progress: "تقدّم توليد الصورة",
    weavingAt: (percent) => `يُنسج · ${percent}`,
    options: "خيارات التوليد",
    versions: "اختر نسخة",
    version: (number) => `النسخة ${number}`,
    failed: "تعذّر توليد الصورة",
    retry: "أعد المحاولة",
    blocked: "لا يمكن توليد هذه الصورة",
    edit: "تعديل بالوصف",
    use: "استخدم الصورة",
    variations: "تنويعات مشابهة",
    saysQueued: "الصورة في الانتظار",
    saysWeaving: "تُنسج الصورة",
    saysCompleted: "الصورة جاهزة",
  },
  en: {
    title: "Image generation",
    queued: "Queued",
    weaving: "Weaving",
    completed: "Ready",
    failedPill: "Failed",
    progress: "Image progress",
    weavingAt: (percent) => `Weaving · ${percent}`,
    options: "Generation options",
    versions: "Choose a version",
    version: (number) => `Version ${number}`,
    failed: "Couldn't create the image",
    retry: "Try again",
    blocked: "This image can't be made",
    edit: "Edit with a description",
    use: "Use image",
    variations: "Similar variations",
    saysQueued: "The image is queued",
    saysWeaving: "Weaving the image",
    saysCompleted: "The image is ready",
  },
};
