import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { navigate } from "../App";
import { ExternalBlob, Gender } from "../backend";
import { createActorWithConfig } from "../config";

const STEPS = [
  "Personal Info",
  "Work Profile",
  "Education",
  "Bank Details",
  "KYC",
  "Declaration",
  "Review & Su...",
  "Acceptance Letter",
];

type FileState = { file: File | null; name: string };

interface FormData {
  fullName: string;
  dob: string;
  gender: "male" | "female" | "other" | "";
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  postsApplying: string[];
  typesOfCalling: string[];
  hasExperience: boolean;
  experienceDetails: string;
  experienceCertificate: FileState;
  relievingLetter: FileState;
  salarySlip1: FileState;
  salarySlip2: FileState;
  salarySlip3: FileState;
  qualification: string;
  cert10: FileState;
  cert12: FileState;
  diploma: FileState;
  bachelor: FileState;
  master: FileState;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  cancelledCheque: FileState;
  aadhaarNumber: string;
  panNumber: string;
  aadhaarCard: FileState;
  panCard: FileState;
  passportPhoto: FileState;
  declarationDate: string;
  signatureDataUrl: string;
}

const emptyFile: FileState = { file: null, name: "" };

const initialFormData: FormData = {
  fullName: "",
  dob: "",
  gender: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  postsApplying: [],
  typesOfCalling: [],
  hasExperience: false,
  experienceDetails: "",
  experienceCertificate: emptyFile,
  relievingLetter: emptyFile,
  salarySlip1: emptyFile,
  salarySlip2: emptyFile,
  salarySlip3: emptyFile,
  qualification: "",
  cert10: emptyFile,
  cert12: emptyFile,
  diploma: emptyFile,
  bachelor: emptyFile,
  master: emptyFile,
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  ifscCode: "",
  upiId: "",
  cancelledCheque: emptyFile,
  aadhaarNumber: "",
  panNumber: "",
  aadhaarCard: emptyFile,
  panCard: emptyFile,
  passportPhoto: emptyFile,
  declarationDate: new Date().toISOString().split("T")[0],
  signatureDataUrl: "",
};

const POSTS = [
  "Tele Caller",
  "Back Office",
  "Sales Executive",
  "IT Developer",
  "HR (Human Resource)",
  "HR Manager",
  "Accountant",
  "Branch Manager",
  "Managing Director",
];
const CALLING_TYPES = [
  "Personal Loan",
  "Jumbo Loan",
  "Loan Against Property",
  "Credit Card",
  "Vehicle Loan",
  "Home Loan",
  "Business Loan",
  "Loan Against Security",
  "Car Loan",
  "Education Loan",
];

function FileUpload({
  label,
  state,
  onChange,
  required,
  hint,
}: {
  label: string;
  state: FileState;
  onChange: (fs: FileState) => void;
  required?: boolean;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="mb-4">
      <Label className="text-sm font-medium text-gray-700 block mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="text-gray-400 text-xs ml-1">{hint}</span>}
      </Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-navy-600 text-navy-600 hover:bg-navy-50"
          onClick={() => ref.current?.click()}
        >
          Choose File
        </Button>
        <span className="text-sm text-gray-500">
          {state.name || "No file chosen"}
        </span>
        <input
          ref={ref}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            onChange({ file, name: file?.name ?? "" });
          }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">Max file size: 10MB</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-navy-600 text-white px-4 py-2 font-bold text-sm tracking-wide rounded mb-4 mt-2">
      {title}
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 block mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

async function fileToExternalBlob(
  fs: FileState,
): Promise<ExternalBlob | undefined> {
  if (!fs.file) return undefined;
  const arr = await fs.file.arrayBuffer();
  return ExternalBlob.fromBytes(new Uint8Array(arr));
}

export default function FormPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const update = (key: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e3a6e";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    update("signatureDataUrl", canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update("signatureDataUrl", "");
  };

  const toggleCheckbox = (
    key: "postsApplying" | "typesOfCalling",
    value: string,
  ) => {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.signatureDataUrl) {
      toast.error("Please draw your signature before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const [
        expCert,
        relLetter,
        slip1,
        slip2,
        slip3,
        c10,
        c12,
        dip,
        bach,
        mas,
        cheque,
        adh,
        pan,
        photo,
      ] = await Promise.all([
        fileToExternalBlob(form.experienceCertificate),
        fileToExternalBlob(form.relievingLetter),
        fileToExternalBlob(form.salarySlip1),
        fileToExternalBlob(form.salarySlip2),
        fileToExternalBlob(form.salarySlip3),
        fileToExternalBlob(form.cert10),
        fileToExternalBlob(form.cert12),
        fileToExternalBlob(form.diploma),
        fileToExternalBlob(form.bachelor),
        fileToExternalBlob(form.master),
        fileToExternalBlob(form.cancelledCheque),
        fileToExternalBlob(form.aadhaarCard),
        fileToExternalBlob(form.panCard),
        fileToExternalBlob(form.passportPhoto),
      ]);

      const actor = await createActorWithConfig();
      await actor.submitInductionForm({
        personalInfo: {
          fullName: form.fullName,
          dob: form.dob,
          gender:
            form.gender === "male"
              ? Gender.male
              : form.gender === "female"
                ? Gender.female
                : Gender.other,
          phone: form.phone,
          alternatePhone: form.alternatePhone,
          email: form.email,
          address: form.address,
        },
        workProfile: {
          postsApplying: form.postsApplying,
          typesOfCalling: form.typesOfCalling,
          hasExperience: form.hasExperience,
          experienceDetails: form.experienceDetails,
          experienceCertificate: expCert,
          relievingLetter: relLetter,
          salarySlip1: slip1,
          salarySlip2: slip2,
          salarySlip3: slip3,
        },
        education: {
          qualification: form.qualification,
          cert10: c10,
          cert12: c12,
          diploma: dip,
          bachelor: bach,
          master: mas,
        },
        bankDetails: {
          bankName: form.bankName,
          accountHolder: form.accountHolder,
          accountNumber: form.accountNumber,
          ifscCode: form.ifscCode,
          upiId: form.upiId || undefined,
          cancelledCheque: cheque,
        },
        kyc: {
          aadhaarNumber: form.aadhaarNumber,
          panNumber: form.panNumber,
          aadhaarCard: adh,
          panCard: pan,
          passportPhoto: photo,
        },
        declaration: {
          date: form.declarationDate,
          signatureDataUrl: form.signatureDataUrl,
        },
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(
        `Submission failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div
          className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center"
          data-ocid="form.success_state"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy-700 mb-2">
            Form Submitted!
          </h2>
          <p className="text-gray-500 mb-6">
            Your induction form has been submitted successfully. HR will review
            and contact you soon.
          </p>
          <Button
            className="bg-navy-600 hover:bg-navy-700 text-white w-full"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-start justify-between">
          <div>
            <h1 className="font-bold text-lg tracking-wide">
              HR INDUCTION FORM
            </h1>
            <p className="text-navy-200 text-xs mt-0.5">
              Email: infinexyfinance@gmail.com | Mo. 8460071353
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-lg px-3 py-2">
            <img
              src="/assets/generated/infinexy-logo.png"
              alt="Infinexy"
              className="h-8 w-auto object-contain"
            />
            <span className="text-sm font-semibold">Infinexy Solution</span>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center min-w-max">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center min-w-[80px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      i < step
                        ? "bg-gold-500 border-gold-500 text-white"
                        : i === step
                          ? "bg-navy-600 border-navy-600 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs mt-1 text-center leading-tight max-w-[70px] ${
                      i === step
                        ? "text-navy-600 font-semibold"
                        : i < step
                          ? "text-gold-600"
                          : "text-gray-400"
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-6 mb-4 ${i < step ? "bg-gold-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 py-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {step === 0 && <Step1 form={form} update={update} />}
            {step === 1 && (
              <Step2
                form={form}
                update={update}
                toggleCheckbox={toggleCheckbox}
              />
            )}
            {step === 2 && <Step3 form={form} update={update} />}
            {step === 3 && <Step4 form={form} update={update} />}
            {step === 4 && <Step5 form={form} update={update} />}
            {step === 5 && (
              <Step6
                form={form}
                update={update}
                canvasRef={canvasRef}
                startDraw={startDraw}
                draw={draw}
                endDraw={endDraw}
                clearSignature={clearSignature}
              />
            )}
            {step === 6 && <Step7 form={form} onEdit={() => setStep(0)} />}
            {step === 7 && <Step8 form={form} />}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() =>
                  step === 7 ? setStep(6) : setStep((s) => Math.max(0, s - 1))
                }
                disabled={step === 0}
                className="border-gray-300"
                data-ocid="form.back.button"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="flex gap-2">
                {step === 5 && (
                  <Button
                    className="bg-navy-600 hover:bg-navy-700 text-white"
                    onClick={() => {
                      if (!form.signatureDataUrl) {
                        toast.error("Please draw your signature to continue");
                        return;
                      }
                      setStep(6);
                    }}
                    data-ocid="form.proceed_review.button"
                  >
                    Proceed to Review
                  </Button>
                )}
                {(step < 5 || step === 6) && (
                  <Button
                    className="bg-navy-600 hover:bg-navy-700 text-white"
                    onClick={() => setStep((s) => Math.min(7, s + 1))}
                    data-ocid="form.next.button"
                  >
                    Next →
                  </Button>
                )}
                {step === 7 && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleSubmit}
                    disabled={submitting}
                    data-ocid="form.submit.button"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit & Accept"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-3 text-center text-xs text-gray-400">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="hover:text-navy-600 underline"
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function Step1({
  form,
  update,
}: { form: FormData; update: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div>
      <SectionHeader title="PERSONAL INFORMATION" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Full Name" required>
          <Input
            data-ocid="personal.fullname.input"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Enter full name"
          />
        </FormField>
        <FormField label="Date of Birth" required>
          <Input
            data-ocid="personal.dob.input"
            type="date"
            value={form.dob}
            onChange={(e) => update("dob", e.target.value)}
          />
        </FormField>
        <FormField label="Gender" required>
          <div className="flex gap-4 mt-2">
            {(["male", "female"] as const).map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={() => update("gender", g)}
                  className="accent-navy-600"
                />
                <span className="capitalize text-sm">{g}</span>
              </label>
            ))}
          </div>
        </FormField>
        <FormField label="Phone Number" required>
          <Input
            data-ocid="personal.phone.input"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="Enter phone number"
          />
        </FormField>
        <FormField label="Alternate Contact Number" required>
          <Input
            data-ocid="personal.alt_phone.input"
            value={form.alternatePhone}
            onChange={(e) => update("alternatePhone", e.target.value)}
            placeholder="Alternate number"
          />
        </FormField>
        <FormField label="Email Address" required>
          <Input
            data-ocid="personal.email.input"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="Enter email"
          />
        </FormField>
      </div>
      <div className="mt-4">
        <FormField label="Full Address" required>
          <Textarea
            data-ocid="personal.address.textarea"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Enter full address"
            rows={3}
          />
        </FormField>
      </div>
    </div>
  );
}

function Step2({
  form,
  update,
  toggleCheckbox,
}: {
  form: FormData;
  update: (k: keyof FormData, v: unknown) => void;
  toggleCheckbox: (k: "postsApplying" | "typesOfCalling", v: string) => void;
}) {
  return (
    <div>
      <SectionHeader title="WORK PROFILE" />
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Applying For the post of <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {POSTS.map((post) => (
            <div
              key={post}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <Checkbox
                checked={form.postsApplying.includes(post)}
                onCheckedChange={() => toggleCheckbox("postsApplying", post)}
                data-ocid="work.post.checkbox"
              />
              <span>{post}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Types of Calling
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CALLING_TYPES.map((ct) => (
            <div
              key={ct}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <Checkbox
                checked={form.typesOfCalling.includes(ct)}
                onCheckedChange={() => toggleCheckbox("typesOfCalling", ct)}
                data-ocid="work.calling.checkbox"
              />
              <span>{ct}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 cursor-pointer text-sm mb-4">
        <Checkbox
          checked={form.hasExperience}
          onCheckedChange={(v) => update("hasExperience", v === true)}
          data-ocid="work.has_experience.checkbox"
        />
        <span>I have prior work experience</span>
      </div>
      {form.hasExperience && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <FormField label="Experience Details">
            <Textarea
              data-ocid="work.experience_details.textarea"
              value={form.experienceDetails}
              onChange={(e) => update("experienceDetails", e.target.value)}
              placeholder="Describe your experience"
              rows={3}
            />
          </FormField>
          <div className="mt-4">
            <FileUpload
              label="Upload Experience Certificate"
              state={form.experienceCertificate}
              onChange={(v) => update("experienceCertificate", v)}
            />
            <FileUpload
              label="Upload Relieving Letter"
              state={form.relievingLetter}
              onChange={(v) => update("relievingLetter", v)}
            />
            <FileUpload
              label="Upload Salary Slip – Month 1"
              state={form.salarySlip1}
              onChange={(v) => update("salarySlip1", v)}
            />
            <FileUpload
              label="Upload Salary Slip – Month 2"
              state={form.salarySlip2}
              onChange={(v) => update("salarySlip2", v)}
            />
            <FileUpload
              label="Upload Salary Slip – Month 3"
              state={form.salarySlip3}
              onChange={(v) => update("salarySlip3", v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Step3({
  form,
  update,
}: { form: FormData; update: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div>
      <SectionHeader title="EDUCATION" />
      <FormField label="Education Level / Qualification" required>
        <Input
          data-ocid="education.qualification.input"
          value={form.qualification}
          onChange={(e) => update("qualification", e.target.value)}
          placeholder="e.g. Bachelor of Commerce"
          className="mb-4"
        />
      </FormField>
      <FileUpload
        label="Upload Class 10th Certificate"
        state={form.cert10}
        onChange={(v) => update("cert10", v)}
        hint="(Optional)"
      />
      <FileUpload
        label="Upload Class 12th Certificate"
        state={form.cert12}
        onChange={(v) => update("cert12", v)}
        hint="(Optional)"
      />
      <FileUpload
        label="Upload Diploma Certificate"
        state={form.diploma}
        onChange={(v) => update("diploma", v)}
        hint="(Optional)"
      />
      <FileUpload
        label="Upload Bachelor's Degree Certificate"
        state={form.bachelor}
        onChange={(v) => update("bachelor", v)}
        hint="(Optional)"
      />
      <FileUpload
        label="Upload Master's Degree Certificate"
        state={form.master}
        onChange={(v) => update("master", v)}
        hint="(Optional)"
      />
    </div>
  );
}

function Step4({
  form,
  update,
}: { form: FormData; update: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div>
      <SectionHeader title="BANK DETAILS" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Bank Name" required>
          <Input
            data-ocid="bank.bankname.input"
            value={form.bankName}
            onChange={(e) => update("bankName", e.target.value)}
            placeholder="Enter bank name"
          />
        </FormField>
        <FormField label="Account Holder Name" required>
          <Input
            data-ocid="bank.account_holder.input"
            value={form.accountHolder}
            onChange={(e) => update("accountHolder", e.target.value)}
            placeholder="Account holder name"
          />
        </FormField>
        <FormField label="Account Number" required>
          <Input
            data-ocid="bank.account_number.input"
            value={form.accountNumber}
            onChange={(e) => update("accountNumber", e.target.value)}
            placeholder="Enter account number"
          />
        </FormField>
        <FormField label="IFSC Code" required>
          <Input
            data-ocid="bank.ifsc.input"
            value={form.ifscCode}
            onChange={(e) => update("ifscCode", e.target.value)}
            placeholder="e.g. SBIN0001234"
          />
        </FormField>
      </div>
      <div className="mt-4">
        <FormField label="UPI ID (if any)">
          <Input
            data-ocid="bank.upi.input"
            value={form.upiId}
            onChange={(e) => update("upiId", e.target.value)}
            placeholder="Optional"
            className="mb-4"
          />
        </FormField>
        <FileUpload
          label="Upload Cancelled Cheque or Bank Statement"
          state={form.cancelledCheque}
          onChange={(v) => update("cancelledCheque", v)}
          required
        />
      </div>
    </div>
  );
}

function Step5({
  form,
  update,
}: { form: FormData; update: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div>
      <SectionHeader title="KYC DETAILS" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <FormField label="Aadhaar Number" required>
          <Input
            data-ocid="kyc.aadhaar.input"
            value={form.aadhaarNumber}
            onChange={(e) => update("aadhaarNumber", e.target.value)}
            placeholder="12-digit Aadhaar number"
          />
        </FormField>
        <FormField label="PAN Number" required>
          <Input
            data-ocid="kyc.pan.input"
            value={form.panNumber}
            onChange={(e) => update("panNumber", e.target.value)}
            placeholder="10-character PAN"
          />
        </FormField>
      </div>
      <FileUpload
        label="Upload Aadhaar Card"
        state={form.aadhaarCard}
        onChange={(v) => update("aadhaarCard", v)}
        required
      />
      <FileUpload
        label="Upload PAN Card"
        state={form.panCard}
        onChange={(v) => update("panCard", v)}
        required
      />
      <FileUpload
        label="Upload Passport Size Photo (White Background)"
        state={form.passportPhoto}
        onChange={(v) => update("passportPhoto", v)}
        required
      />
    </div>
  );
}

function Step6({
  form,
  update,
  canvasRef,
  startDraw,
  draw,
  endDraw,
  clearSignature,
}: {
  form: FormData;
  update: (k: keyof FormData, v: unknown) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startDraw: (e: React.MouseEvent | React.TouchEvent) => void;
  draw: (e: React.MouseEvent | React.TouchEvent) => void;
  endDraw: () => void;
  clearSignature: () => void;
}) {
  return (
    <div>
      <SectionHeader title="DECLARATION" />
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
        <p className="text-sm text-amber-900 leading-relaxed">
          I hereby declare that the information provided above is true and
          correct to the best of my knowledge. I understand that providing false
          information may lead to termination of association with{" "}
          <strong>INFINEXY SOLUTION</strong>.
        </p>
      </div>
      <div className="mb-6">
        <FormField label="Date">
          <Input
            data-ocid="declaration.date.input"
            type="date"
            value={form.declarationDate}
            onChange={(e) => update("declarationDate", e.target.value)}
            className="max-w-xs"
          />
        </FormField>
      </div>
      <div>
        <Label className="text-sm font-medium text-gray-700 block mb-2">
          Signature <span className="text-red-500">*</span>
        </Label>
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          className="border-2 border-navy-600 rounded-lg w-full cursor-crosshair bg-white"
          style={{ touchAction: "none" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          data-ocid="declaration.signature.canvas_target"
        />
        <div className="flex items-center justify-between mt-2">
          <span>
            {!form.signatureDataUrl && (
              <p className="text-xs text-amber-600">
                Please draw your signature to continue
              </p>
            )}
            {form.signatureDataUrl && (
              <p className="text-xs text-green-600">✓ Signature captured</p>
            )}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            className="text-gray-500"
            data-ocid="declaration.clear_signature.button"
          >
            Clear Signature
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewTable({
  title,
  rows,
}: { title: string; rows: [string, string][] }) {
  return (
    <div className="mb-4">
      <div className="bg-navy-600 text-white px-4 py-2 text-sm font-bold rounded-t">
        {title}
      </div>
      <table className="w-full border border-gray-200 rounded-b text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-gray-100 last:border-0">
              <td className="px-4 py-2 text-gray-500 font-medium w-1/3 bg-gray-50">
                {label}
              </td>
              <td className="px-4 py-2 text-gray-800">
                {value || (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Step7({ form, onEdit }: { form: FormData; onEdit: () => void }) {
  return (
    <div>
      <SectionHeader title="REVIEW & SUBMIT" />
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Please review all information carefully before submitting.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          data-ocid="review.edit.button"
        >
          ← Edit Form
        </Button>
      </div>
      <ReviewTable
        title="PERSONAL INFORMATION"
        rows={[
          ["Full Name", form.fullName],
          ["Date of Birth", form.dob],
          ["Gender", form.gender],
          ["Phone", form.phone],
          ["Alternate Phone", form.alternatePhone],
          ["Email", form.email],
          ["Address", form.address],
        ]}
      />
      <ReviewTable
        title="WORK PROFILE"
        rows={[
          ["Posts Applying", form.postsApplying.join(", ")],
          ["Types of Calling", form.typesOfCalling.join(", ")],
          ["Has Experience", form.hasExperience ? "Yes" : "No"],
          ...(form.hasExperience
            ? [
                ["Experience Details", form.experienceDetails] as [
                  string,
                  string,
                ],
              ]
            : []),
        ]}
      />
      <ReviewTable
        title="EDUCATION"
        rows={[
          ["Qualification", form.qualification],
          ["10th Certificate", form.cert10.name || "Not uploaded"],
          ["12th Certificate", form.cert12.name || "Not uploaded"],
          ["Diploma", form.diploma.name || "Not uploaded"],
          ["Bachelor's Degree", form.bachelor.name || "Not uploaded"],
          ["Master's Degree", form.master.name || "Not uploaded"],
        ]}
      />
      <ReviewTable
        title="BANK DETAILS"
        rows={[
          ["Bank Name", form.bankName],
          ["Account Holder", form.accountHolder],
          ["Account Number", form.accountNumber],
          ["IFSC Code", form.ifscCode],
          ["UPI ID", form.upiId],
          ["Cancelled Cheque", form.cancelledCheque.name || "Not uploaded"],
        ]}
      />
      <ReviewTable
        title="KYC DETAILS"
        rows={[
          ["Aadhaar Number", form.aadhaarNumber],
          ["PAN Number", form.panNumber],
          ["Aadhaar Card", form.aadhaarCard.name || "Not uploaded"],
          ["PAN Card", form.panCard.name || "Not uploaded"],
          ["Passport Photo", form.passportPhoto.name || "Not uploaded"],
        ]}
      />
      <ReviewTable
        title="DECLARATION"
        rows={[
          ["Date", form.declarationDate],
          ["Signature", form.signatureDataUrl ? "✓ Signed" : "Not signed"],
        ]}
      />
    </div>
  );
}

function Step8({ form }: { form: FormData }) {
  const [accepted, setAccepted] = useState(false);
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return (
    <div>
      <SectionHeader title="ACCEPTANCE LETTER" />
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-sm">
        <div className="text-center mb-6">
          <img
            src="/assets/generated/infinexy-logo.png"
            alt="Infinexy"
            className="h-12 w-auto object-contain mx-auto mb-2"
          />
          <h2 className="text-lg font-bold text-navy-700">INFINEXY SOLUTION</h2>
          <h3 className="text-base font-semibold text-gray-700 mt-2">
            EMPLOYMENT TERMS & PERFORMANCE AGREEMENT
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4 border-b pb-4">
          <span>
            <strong>Date:</strong> {today}
          </span>
          <span>
            <strong>Employee Name:</strong> {form.fullName || "___________"}
          </span>
          <span>
            <strong>Employee ID:</strong> To be assigned
          </span>
          <span>
            <strong>Position:</strong> {form.postsApplying[0] || "___________"}
          </span>
        </div>
        <div className="space-y-4 text-xs text-gray-700">
          <div>
            <h4 className="font-bold text-navy-700 mb-1">
              1. Performance-Linked Salary Structure
            </h4>
            <p>
              The employee's compensation is directly linked to performance
              metrics and target achievement. A 20% salary payout clause applies
              for missed monthly targets as defined by the management.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-navy-700 mb-1">
              2. Data Security and Confidentiality
            </h4>
            <p>
              The employee agrees to maintain strict confidentiality of all
              client and company data. Any breach of data security or theft
              shall result in a financial liability of Rs. 1,00,000 (Rupees One
              Lakh) payable to Infinexy Solution.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-navy-700 mb-1">
              3. General Terms & Conditions
            </h4>
            <p>
              The employee agrees to abide by all company policies, codes of
              conduct, and applicable laws. This agreement is subject to
              periodic review and amendment by the management.
            </p>
          </div>
        </div>
        <div className="mt-6 border border-gray-300 rounded-lg p-4 bg-white">
          <h4 className="font-bold text-gray-700 mb-3 text-xs">
            DECLARATION & ACCEPTANCE
          </h4>
          <div className="border-b border-dashed border-gray-300 pb-2 mb-3">
            <span className="text-xs text-gray-500">
              Signature: ___________________________
            </span>
          </div>
          {form.signatureDataUrl && (
            <img
              src={form.signatureDataUrl}
              alt="Signature"
              className="h-16 object-contain"
            />
          )}
        </div>
      </div>
      <div
        className="flex items-start gap-3 mt-6 cursor-pointer"
        onClick={() => setAccepted((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setAccepted((v) => !v)}
      >
        <Checkbox
          checked={accepted}
          onCheckedChange={(v) => setAccepted(v === true)}
          data-ocid="acceptance.agree.checkbox"
          className="mt-0.5"
        />
        <span className="text-sm text-gray-700 leading-relaxed">
          I <strong>{form.fullName || "[Name]"}</strong>, have read and fully
          understood the terms mentioned above. I voluntarily agree to the
          performance-linked salary structure (including the 20% payout clause
          for missed targets) and the financial liability of{" "}
          <strong>Rs. 1,00,000</strong> in the event of a data breach or theft.
        </span>
      </div>
    </div>
  );
}
