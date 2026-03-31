import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  type Gender = {
    #male;
    #female;
    #other;
  };

  type PersonalInfo = {
    fullName : Text;
    dob : Text;
    gender : Gender;
    phone : Text;
    alternatePhone : Text;
    email : Text;
    address : Text;
  };

  type WorkProfile = {
    postsApplying : [Text];
    typesOfCalling : [Text];
    hasExperience : Bool;
    experienceDetails : Text;
    experienceCertificate : ?Storage.ExternalBlob;
    relievingLetter : ?Storage.ExternalBlob;
    salarySlip1 : ?Storage.ExternalBlob;
    salarySlip2 : ?Storage.ExternalBlob;
    salarySlip3 : ?Storage.ExternalBlob;
  };

  type Education = {
    qualification : Text;
    cert10 : ?Storage.ExternalBlob;
    cert12 : ?Storage.ExternalBlob;
    diploma : ?Storage.ExternalBlob;
    bachelor : ?Storage.ExternalBlob;
    master : ?Storage.ExternalBlob;
  };

  type BankDetails = {
    bankName : Text;
    accountHolder : Text;
    accountNumber : Text;
    ifscCode : Text;
    upiId : ?Text;
    cancelledCheque : ?Storage.ExternalBlob;
  };

  type KYC = {
    aadhaarNumber : Text;
    panNumber : Text;
    aadhaarCard : ?Storage.ExternalBlob;
    panCard : ?Storage.ExternalBlob;
    passportPhoto : ?Storage.ExternalBlob;
  };

  type Declaration = {
    date : Text;
    signatureDataUrl : Text;
  };

  type EmployeeStatus = {
    #pending;
    #active;
    #inactive;
  };

  // V1 type (old - without dateOfJoining/dateOfLeaving) kept for migration
  type InductionFormV1 = {
    personalInfo : PersonalInfo;
    workProfile : WorkProfile;
    education : Education;
    bankDetails : BankDetails;
    kyc : KYC;
    declaration : Declaration;
    status : EmployeeStatus;
    employeeId : ?Text;
    submittedAt : Int;
  };

  // V2 type (new - with date fields)
  type InductionForm = {
    personalInfo : PersonalInfo;
    workProfile : WorkProfile;
    education : Education;
    bankDetails : BankDetails;
    kyc : KYC;
    declaration : Declaration;
    status : EmployeeStatus;
    employeeId : ?Text;
    submittedAt : Int;
    dateOfJoining : ?Text;
    dateOfLeaving : ?Text;
  };

  type InductionFormInput = {
    personalInfo : PersonalInfo;
    workProfile : WorkProfile;
    education : Education;
    bankDetails : BankDetails;
    kyc : KYC;
    declaration : Declaration;
  };

  type TotalStats = {
    total : Nat;
    pending : Nat;
    active : Nat;
    inactive : Nat;
  };

  module Gender {
    public func toText(gender : Gender) : Text {
      switch (gender) {
        case (#male) { "male" };
        case (#female) { "female" };
        case (#other) { "other" };
      };
    };
  };

  module EmployeeStatus {
    public func toText(status : EmployeeStatus) : Text {
      switch (status) {
        case (#pending) { "pending" };
        case (#active) { "active" };
        case (#inactive) { "inactive" };
      };
    };
  };

  module InductionForm {
    public func compare(a : InductionForm, b : InductionForm) : Order.Order {
      Int.compare(a.submittedAt, b.submittedAt);
    };
  };

  // Keep old stable var name so existing stored data loads correctly
  let forms : Map.Map<Text, InductionFormV1> = Map.empty();

  // New stable var for v2 type
  let formsV2 : Map.Map<Text, InductionForm> = Map.empty();

  var adminUsername : Text = "admin";
  var adminPassword : Text = "admin123";
  var sessionToken : ?Text = null;

  // Migrate v1 -> v2 on upgrade
  system func postupgrade() {
    for ((k, v) in forms.entries()) {
      if (formsV2.get(k) == null) {
        formsV2.add(k, {
          personalInfo = v.personalInfo;
          workProfile = v.workProfile;
          education = v.education;
          bankDetails = v.bankDetails;
          kyc = v.kyc;
          declaration = v.declaration;
          status = v.status;
          employeeId = v.employeeId;
          submittedAt = v.submittedAt;
          dateOfJoining = null;
          dateOfLeaving = null;
        });
      };
    };
    forms.clear();
  };

  func requireValidToken(token : Text) {
    if (sessionToken != ?token) {
      Runtime.trap("Invalid session token");
    };
  };

  public shared ({ caller }) func adminLogin(username : Text, password : Text) : async Text {
    if (username == adminUsername and password == adminPassword) {
      let token = "token_" # Time.now().toText();
      sessionToken := ?token;
      token;
    } else {
      Runtime.trap("Invalid credentials");
    };
  };

  public shared ({ caller }) func changePassword(token : Text, newPassword : Text) : async () {
    requireValidToken(token);
    adminPassword := newPassword;
  };

  public shared ({ caller }) func submitInductionForm(form : InductionFormInput) : async Text {
    let id = "form_" # Time.now().toText();
    let newForm : InductionForm = {
      form with
      status = #pending;
      employeeId = null;
      submittedAt = Time.now();
      dateOfJoining = null;
      dateOfLeaving = null;
    };
    formsV2.add(id, newForm);
    id;
  };

  public query ({ caller }) func getAllSubmissions(token : Text) : async [InductionForm] {
    requireValidToken(token);
    formsV2.values().toArray().sort();
  };

  public query ({ caller }) func getSubmission(token : Text, id : Text) : async InductionForm {
    requireValidToken(token);
    switch (formsV2.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?form) { form };
    };
  };

  public shared ({ caller }) func updateStatus(token : Text, id : Text, status : EmployeeStatus) : async () {
    requireValidToken(token);
    let form = switch (formsV2.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?form) { form };
    };
    formsV2.add(id, { form with status });
  };

  public shared ({ caller }) func assignEmployeeId(token : Text, id : Text, employeeId : Text) : async () {
    requireValidToken(token);
    let form = switch (formsV2.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?form) { form };
    };
    formsV2.add(id, { form with employeeId = ?employeeId });
  };

  public shared ({ caller }) func updateEmployeeDates(token : Text, id : Text, dateOfJoining : ?Text, dateOfLeaving : ?Text) : async () {
    requireValidToken(token);
    let form = switch (formsV2.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?form) { form };
    };
    formsV2.add(id, { form with dateOfJoining; dateOfLeaving });
  };

  public shared ({ caller }) func deleteSubmission(token : Text, id : Text) : async () {
    requireValidToken(token);
    formsV2.remove(id);
  };

  public query ({ caller }) func getTotalStats() : async TotalStats {
    var total = 0;
    var pending = 0;
    var active = 0;
    var inactive = 0;

    formsV2.values().forEach(
      func(form) {
        total += 1;
        switch (form.status) {
          case (#pending) { pending += 1 };
          case (#active) { active += 1 };
          case (#inactive) { inactive += 1 };
        };
      }
    );

    {
      total;
      pending;
      active;
      inactive;
    };
  };
};
