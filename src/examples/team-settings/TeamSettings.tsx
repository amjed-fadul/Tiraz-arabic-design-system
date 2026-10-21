import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { Close } from "@radix-ui/react-dialog";
import { UserMinus, UserPlus } from "lucide-react";
import {
  AssistantControls,
  Avatar,
  Badge,
  Button,
  DataTable,
  Field,
  Input,
  Modal,
  Select,
  Tabs,
  useToast,
} from "../../system";
import type {
  AssistantMemoryItem,
  AssistantPermission,
  DataTableColumn,
  ModelOption,
  PermissionLevel,
} from "../../system";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { useScreen } from "../frame/screen";
import {
  context,
  defaultModel,
  memory as storedMemory,
  models,
  permissions as storedPermissions,
  roles,
  seats,
  team,
} from "./data";
import type { Member, Role } from "./data";
import "./team-settings.css";

const arabicPlural = new Intl.PluralRules("ar");

export function TeamSettings() {
  return (
    <ScreenFrame slug="team-settings">
      <TeamSettingsContent />
    </ScreenFrame>
  );
}

function TeamSettingsContent() {
  const { language, t, number, date } = useScreen();
  const { toast } = useToast();
  const [tab, setTab] = useState("team");
  const [members, setMembers] = useState<readonly Member[]>(team);
  const heading = useRef<HTMLHeadingElement>(null);
  const refocus = useRef(false);
  const invited = useRef(0);
  // Assistant controls: the person's settings, which this screen holds. The
  // host enforces them when the assistant acts; the pattern only reports them.
  const [levels, setLevels] = useState<Record<string, PermissionLevel>>(() =>
    Object.fromEntries(storedPermissions.map((item) => [item.id, item.level])),
  );
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [paused, setPaused] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      storedMemory.filter((item) => item.paused).map((item) => [item.id, true]),
    ),
  );
  const [deleted, setDeleted] = useState<readonly string[]>([]);
  const [model, setModel] = useState(defaultModel);

  // Removing a member takes the row, and with it the button that had focus, so
  // focus goes to the heading above the table instead of dropping to the page.
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    heading.current?.focus();
  }, [members]);

  const nameOf = (member: Member) =>
    member.name ? t(member.name.ar, member.name.en) : member.email;
  // The count agrees with its noun in Arabic: one, the dual, 3–10, then 11 and
  // up. It follows «من», so the dual is «عضوين».
  function people(count: number) {
    if (language !== "ar")
      return `${number(count)} ${count === 1 ? "member" : "members"}`;
    switch (arabicPlural.select(count)) {
      case "one":
        return "عضو واحد";
      case "two":
        return "عضوين";
      case "few":
        return `${number(count)} أعضاء`;
      case "many":
        return `${number(count)} عضوًا`;
      default:
        return `${number(count)} عضو`;
    }
  }

  function invite(email: string, role: Role) {
    invited.current += 1;
    setMembers((current) => [
      ...current,
      {
        id: `invited-${invited.current}`,
        name: null,
        email,
        role,
        lastActive: null,
      },
    ]);
    toast({
      title: t("أُرسلت الدعوة", "Invitation sent"),
      description: email,
      tone: "success",
    });
  }
  function remove(member: Member) {
    refocus.current = true;
    setMembers((current) => current.filter((item) => item.id !== member.id));
    toast({
      title: t(
        `تمت إزالة ${nameOf(member)} من الفريق`,
        `${nameOf(member)} was removed from the team`,
      ),
      tone: "success",
    });
  }

  const columns: DataTableColumn<Member>[] = [
    {
      id: "member",
      header: t("العضو", "Member"),
      rowHeader: true,
      sortValue: nameOf,
      cell: (member) => <MemberCell member={member} />,
    },
    {
      id: "role",
      header: t("الدور", "Role"),
      sortValue: (member) => t(roles[member.role].ar, roles[member.role].en),
      cell: (member) => t(roles[member.role].ar, roles[member.role].en),
    },
    {
      id: "active",
      header: t("آخر نشاط", "Last active"),
      sortValue: (member) => member.lastActive ?? "",
      cell: (member) =>
        member.lastActive
          ? date(member.lastActive)
          : t("بانتظار القبول", "Awaiting acceptance"),
    },
    {
      id: "actions",
      header: t("الإجراءات", "Actions"),
      cell: (member) =>
        member.you ? null : (
          <RemoveMember member={member} onRemove={() => remove(member)} />
        ),
    },
  ];

  const permissions: AssistantPermission[] = storedPermissions.map((item) => ({
    id: item.id,
    label: t(item.label.ar, item.label.en),
    description: t(item.description.ar, item.description.en),
    level: levels[item.id],
    risks: item.risks,
  }));
  const remembered: AssistantMemoryItem[] = storedMemory
    .filter((item) => !deleted.includes(item.id))
    .map((item) => ({
      id: item.id,
      category: t(item.category.ar, item.category.en),
      text: t(item.text.ar, item.text.en),
      source: t(item.source.ar, item.source.en),
      date: date(item.date),
      paused: !!paused[item.id],
    }));
  const modelOptions: ModelOption[] = models.map((item) => ({
    id: item.id,
    name: t(item.name.ar, item.name.en),
    provider: t(item.provider.ar, item.provider.en),
    description: t(item.description.ar, item.description.en),
    context: item.context,
  }));

  return (
    <div className="team-settings">
      <ScreenHeader
        description={t(
          "أعضاء فريق المالية، وما يفعله المساعد دون أن يسألك.",
          "The finance team, and what the assistant does without asking you.",
        )}
      />
      <Tabs
        label={t("أقسام الإعدادات", "Settings sections")}
        value={tab}
        onValueChange={setTab}
        items={[
          {
            value: "team",
            label: t("الفريق", "Team"),
            content: (
              <div className="team-settings-panel">
                <div className="team-settings-head">
                  <h2
                    ref={heading}
                    tabIndex={-1}
                    className="team-settings-title"
                  >
                    {t("الفريق", "Team")}
                  </h2>
                  <div className="team-settings-invite">
                    <span className="team-settings-seats">
                      {t(
                        `${number(members.length)} من ${number(seats)} مقاعد`,
                        `${number(members.length)} of ${number(seats)} seats`,
                      )}
                    </span>
                    <InviteMember members={members} onInvite={invite} />
                  </div>
                </div>
                <DataTable
                  data={members}
                  columns={columns}
                  getRowId={(member) => member.id}
                  caption={t("أعضاء فريق المالية", "Finance team members")}
                  locale={language}
                  pageSize={seats}
                  emptyContent={t("لا أعضاء في الفريق.", "No team members.")}
                  labels={{
                    previous: t("السابق", "Previous"),
                    next: t("التالي", "Next"),
                    pagination: t("صفحات الفريق", "Team pages"),
                    sortAscending: (header) =>
                      t(`ترتيب ${header} تصاعديًا`, `Sort ${header} ascending`),
                    sortDescending: (header) =>
                      t(
                        `ترتيب ${header} تنازليًا`,
                        `Sort ${header} descending`,
                      ),
                    resultCount: (from, to, total) =>
                      t(
                        `${number(from)}–${number(to)} من ${people(total)}`,
                        `${number(from)}–${number(to)} of ${people(total)}`,
                      ),
                  }}
                />
              </div>
            ),
          },
          {
            value: "assistant",
            label: t("المساعد", "Assistant"),
            content: (
              <div className="team-settings-panel">
                <AssistantControls
                  headingLevel={2}
                  permissions={permissions}
                  onPermissionChange={(id, level) =>
                    setLevels((current) => ({ ...current, [id]: level }))
                  }
                  memoryEnabled={memoryEnabled}
                  onMemoryEnabledChange={setMemoryEnabled}
                  memory={remembered}
                  onMemoryPauseChange={(id, next) =>
                    setPaused((current) => ({ ...current, [id]: next }))
                  }
                  // The host deletes the memory from its store, then passes
                  // the shorter list.
                  onMemoryDelete={(id) =>
                    setDeleted((current) => [...current, id])
                  }
                  contextUsage={{
                    used: context.parts.reduce(
                      (total, part) => total + part.value,
                      0,
                    ),
                    capacity: context.capacity,
                    details: context.parts.map((part) => ({
                      id: part.id,
                      label: t(part.label.ar, part.label.en),
                      value: part.value,
                    })),
                    metadata: t(context.note.ar, context.note.en),
                  }}
                  models={modelOptions}
                  model={model}
                  onModelChange={setModel}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

/** An email, left to right, that may break after the «@» and nowhere else. */
function Email({
  address,
  className,
}: {
  address: string;
  className?: string;
}) {
  const [name, domain = ""] = address.split("@");
  return (
    <bdi dir="ltr" className={className}>
      {name}@<wbr />
      {domain}
    </bdi>
  );
}

/** A person in the table or in a confirmation: avatar, name, email. */
function MemberCell({ member }: { member: Member }) {
  const { t } = useScreen();
  const name = member.name ? t(member.name.ar, member.name.en) : member.email;
  return (
    <span className="team-settings-member">
      <Avatar
        name={name}
        src={member.photo}
        fallback={member.initials && t(member.initials.ar, member.initials.en)}
        decorative
      />
      <span className="team-settings-who">
        <span className="team-settings-name">
          {member.name ? <bdi>{name}</bdi> : <Email address={member.email} />}
          {member.you && <Badge>{t("أنتِ", "You")}</Badge>}
          {!member.you && !member.name && (
            <Badge tone="info">{t("مدعو", "Invited")}</Badge>
          )}
        </span>
        {member.name && (
          <Email address={member.email} className="team-settings-email" />
        )}
      </span>
    </span>
  );
}

/** «إزالة {name}»: asks first, in a Modal that the row's button opens and, unless it confirms, gets focus back. */
function RemoveMember({
  member,
  onRemove,
}: {
  member: Member;
  onRemove: () => void;
}) {
  const { t } = useScreen();
  const [open, setOpen] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);
  const name = member.name ? t(member.name.ar, member.name.en) : member.email;
  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      // The safe action starts with focus.
      initialFocusRef={cancel}
      title={t(`إزالة ${name} من الفريق؟`, `Remove ${name} from the team?`)}
      description={t(
        "يُسحب الوصول إلى مساحة المالية فورًا، ويتحرر مقعد.",
        "Access to the finance workspace ends at once, and a seat is freed.",
      )}
      closeLabel={t("إغلاق", "Close")}
      trigger={
        <Button
          variant="ghost"
          iconOnly
          aria-label={t(`إزالة ${name}`, `Remove ${name}`)}
        >
          <UserMinus size={17} aria-hidden="true" />
        </Button>
      }
      footer={
        <>
          <Close asChild ref={cancel}>
            <Button variant="secondary">{t("إلغاء", "Cancel")}</Button>
          </Close>
          <Button
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            {t(`إزالة ${name}`, `Remove ${name}`)}
          </Button>
        </>
      }
    >
      <MemberCell member={member} />
    </Modal>
  );
}

/** «دعوة عضو»: a Modal with the invitee's email and role; the new row is marked «مدعو». */
function InviteMember({
  members,
  onInvite,
}: {
  members: readonly Member[];
  onInvite: (email: string, role: Role) => void;
}) {
  const { t } = useScreen();
  const [open, setOpen] = useState(false);
  const formId = useId();
  const email = useRef<HTMLInputElement>(null);
  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      initialFocusRef={email}
      title={t("دعوة عضو", "Invite a member")}
      description={t(
        "أدخل البريد الإلكتروني للمدعو. يحجز مقعدًا في الفريق حتى يقبل الدعوة.",
        "Enter the invitee's email. They hold a seat on the team until they accept.",
      )}
      closeLabel={t("إغلاق", "Close")}
      trigger={
        <Button>
          <UserPlus size={15} aria-hidden="true" />
          {t("دعوة عضو", "Invite a member")}
        </Button>
      }
      footer={
        <>
          <Close asChild>
            <Button variant="secondary">{t("إلغاء", "Cancel")}</Button>
          </Close>
          <Button type="submit" form={formId}>
            {t("أرسل الدعوة", "Send invitation")}
          </Button>
        </>
      }
    >
      {/* The form lives only while the Modal is open, so each invitation starts empty. */}
      <InviteForm
        id={formId}
        inputRef={email}
        members={members}
        onSubmit={(address, role) => {
          onInvite(address, role);
          setOpen(false);
        }}
      />
    </Modal>
  );
}

function InviteForm({
  id,
  inputRef,
  members,
  onSubmit,
}: {
  id: string;
  inputRef: RefObject<HTMLInputElement | null>;
  members: readonly Member[];
  onSubmit: (email: string, role: Role) => void;
}) {
  const { t } = useScreen();
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [error, setError] = useState<string>();
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = address.trim();
    const problem = !value
      ? t("أدخل البريد الإلكتروني.", "Enter an email address.")
      : !inputRef.current?.validity.valid
        ? t("أدخل بريدًا إلكترونيًا صحيحًا.", "Enter a valid email address.")
        : members.some(
              (member) => member.email.toLowerCase() === value.toLowerCase(),
            )
          ? t(
              "هذا البريد في الفريق بالفعل.",
              "This email is already on the team.",
            )
          : members.length >= seats
            ? t(
                "اكتملت المقاعد. أزل عضوًا لتدعو غيره.",
                "All seats are taken. Remove a member to invite another.",
              )
            : undefined;
    if (problem) {
      setError(problem);
      inputRef.current?.focus();
      return;
    }
    onSubmit(value, role);
  }
  return (
    <form id={id} noValidate className="team-settings-form" onSubmit={submit}>
      <Input
        ref={inputRef}
        label={t("البريد الإلكتروني", "Email")}
        type="email"
        dir="ltr"
        autoComplete="off"
        required
        value={address}
        error={error}
        onChange={(event) => {
          setAddress(event.currentTarget.value);
          setError(undefined);
        }}
      />
      <Field label={t("الدور", "Role")}>
        {(field) => (
          <Select
            field={field}
            value={role}
            onValueChange={(value) => setRole(value as Role)}
            options={(["member", "viewer", "admin"] as const).map((value) => ({
              value,
              label: t(roles[value].ar, roles[value].en),
            }))}
          />
        )}
      </Field>
    </form>
  );
}
