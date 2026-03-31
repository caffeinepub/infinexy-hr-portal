import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Declaration {
    date: string;
    signatureDataUrl: string;
}
export interface InductionFormInput {
    kyc: KYC;
    bankDetails: BankDetails;
    education: Education;
    declaration: Declaration;
    personalInfo: PersonalInfo;
    workProfile: WorkProfile;
}
export interface Education {
    cert10?: ExternalBlob;
    cert12?: ExternalBlob;
    bachelor?: ExternalBlob;
    master?: ExternalBlob;
    qualification: string;
    diploma?: ExternalBlob;
}
export interface InductionForm {
    kyc: KYC;
    status: EmployeeStatus;
    bankDetails: BankDetails;
    education: Education;
    submittedAt: bigint;
    declaration: Declaration;
    employeeId?: string;
    personalInfo: PersonalInfo;
    workProfile: WorkProfile;
}
export interface PersonalInfo {
    dob: string;
    alternatePhone: string;
    fullName: string;
    email: string;
    address: string;
    gender: Gender;
    phone: string;
}
export interface WorkProfile {
    experienceDetails: string;
    typesOfCalling: Array<string>;
    salarySlip1?: ExternalBlob;
    salarySlip2?: ExternalBlob;
    salarySlip3?: ExternalBlob;
    experienceCertificate?: ExternalBlob;
    hasExperience: boolean;
    relievingLetter?: ExternalBlob;
    postsApplying: Array<string>;
}
export interface BankDetails {
    ifscCode: string;
    bankName: string;
    cancelledCheque?: ExternalBlob;
    upiId?: string;
    accountNumber: string;
    accountHolder: string;
}
export interface KYC {
    passportPhoto?: ExternalBlob;
    panCard?: ExternalBlob;
    panNumber: string;
    aadhaarCard?: ExternalBlob;
    aadhaarNumber: string;
}
export interface TotalStats {
    total: bigint;
    active: bigint;
    pending: bigint;
    inactive: bigint;
}
export enum EmployeeStatus {
    active = "active",
    pending = "pending",
    inactive = "inactive"
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
}
export interface backendInterface {
    adminLogin(username: string, password: string): Promise<string>;
    assignEmployeeId(token: string, id: string, employeeId: string): Promise<void>;
    changePassword(token: string, newPassword: string): Promise<void>;
    deleteSubmission(token: string, id: string): Promise<void>;
    getAllSubmissions(token: string): Promise<Array<InductionForm>>;
    getSubmission(token: string, id: string): Promise<InductionForm>;
    getTotalStats(): Promise<TotalStats>;
    submitInductionForm(form: InductionFormInput): Promise<string>;
    updateStatus(token: string, id: string, status: EmployeeStatus): Promise<void>;
}
