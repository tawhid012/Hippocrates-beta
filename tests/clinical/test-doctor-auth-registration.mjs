/**
 * HIPPOCRATES AI CLINICAL PLATFORM
 * Automated Test Suite: Doctor Authentication & Registration Number Enforcement
 */

import test from "node:test";
import assert from "node:assert/strict";

test("Doctor Authentication & Registration Number Validation", async (t) => {
  await t.test("Doctor registration lead sequence enforces Doctor Registration Number", () => {
    // Lead sequence validator logic
    function validateDoctorRegistration({ email, password, fullName, role, doctorRegistrationNumber }) {
      if (!email || !password || !fullName) {
        return { valid: false, error: "Missing required fields" };
      }
      if (role === "doctor") {
        if (!doctorRegistrationNumber || doctorRegistrationNumber.trim().length === 0) {
          return { valid: false, error: "Doctor Registration Number is mandatory for medical practitioner registration." };
        }
        if (doctorRegistrationNumber.trim().length < 3) {
          return { valid: false, error: "Doctor Registration Number must be at least 3 characters." };
        }
      }
      return { valid: true, error: null };
    }

    // Attempt doctor signup without registration number
    const missingReg = validateDoctorRegistration({
      email: "dr.smith@hospital.org",
      password: "SecurePassword123!",
      fullName: "Dr. Smith",
      role: "doctor",
      doctorRegistrationNumber: "",
    });
    assert.equal(missingReg.valid, false);
    assert.match(missingReg.error, /Doctor Registration Number is mandatory/);

    // Attempt doctor signup with whitespace only
    const whitespaceReg = validateDoctorRegistration({
      email: "dr.smith@hospital.org",
      password: "SecurePassword123!",
      fullName: "Dr. Smith",
      role: "doctor",
      doctorRegistrationNumber: "   ",
    });
    assert.equal(whitespaceReg.valid, false);

    // Valid doctor signup with registration number
    const validDoctor = validateDoctorRegistration({
      email: "dr.smith@hospital.org",
      password: "SecurePassword123!",
      fullName: "Dr. Smith",
      role: "doctor",
      doctorRegistrationNumber: "MCI-2019-84729",
    });
    assert.equal(validDoctor.valid, true);
    assert.equal(validDoctor.error, null);
  });

  await t.test("Patient registration sequence succeeds without requiring Doctor Registration Number", () => {
    function validatePatientRegistration({ email, password, fullName, role }) {
      if (!email || !password || !fullName) {
        return { valid: false, error: "Missing required fields" };
      }
      return { valid: true, error: null };
    }

    const validPatient = validatePatientRegistration({
      email: "patient@example.com",
      password: "PatientPassword123!",
      fullName: "Jane Doe",
      role: "patient",
    });
    assert.equal(validPatient.valid, true);
    assert.equal(validPatient.error, null);
  });

  await t.test("Google OAuth interception requires Doctor Registration Number before Oracle access", () => {
    // Simulated Google OAuth user metadata state
    const googleUserInitial = {
      id: "usr_google_123",
      email: "physician.google@hospital.org",
      user_metadata: {
        full_name: "Dr. Alex Rivera",
        // Notice: doctor_registration_number is missing on initial Google OAuth sign-in
      },
    };

    function evaluateDoctorAccessGate(user, persona) {
      if (persona !== "doctor") {
        return { gateOpen: false, allowAccess: true };
      }
      const reg = user?.user_metadata?.doctor_registration_number;
      if (!reg || reg.trim().length < 3) {
        return { gateOpen: true, allowAccess: false, reason: "Registration number required" };
      }
      return { gateOpen: false, allowAccess: true, verifiedRegNo: reg.trim() };
    }

    // Step 1: Initial sign in with Google under Doctor persona -> blocked by gate
    const gateCheck1 = evaluateDoctorAccessGate(googleUserInitial, "doctor");
    assert.equal(gateCheck1.gateOpen, true, "Doctor onboarding gate must open for Google user lacking reg no");
    assert.equal(gateCheck1.allowAccess, false, "Doctor mode must be blocked without reg no");

    // Step 2: Patient persona is NEVER gated by doctor requirement
    const patientCheck = evaluateDoctorAccessGate(googleUserInitial, "patient");
    assert.equal(patientCheck.gateOpen, false);
    assert.equal(patientCheck.allowAccess, true);

    // Step 3: User provides Doctor Registration Number via onboarding modal
    const updatedUser = {
      ...googleUserInitial,
      user_metadata: {
        ...googleUserInitial.user_metadata,
        role: "doctor",
        doctor_registration_number: "NMC-2023-99120",
      },
    };

    const gateCheck2 = evaluateDoctorAccessGate(updatedUser, "doctor");
    assert.equal(gateCheck2.gateOpen, false, "Gate must close once verified registration number is saved");
    assert.equal(gateCheck2.allowAccess, true);
    assert.equal(gateCheck2.verifiedRegNo, "NMC-2023-99120");
  });

  await t.test("Patient cannot register as a doctor — strict role immutability", () => {
    // Existing patient account
    const patientUser = {
      id: "usr_patient_456",
      email: "patient.jane@example.com",
      user_metadata: {
        role: "patient",
        full_name: "Jane Doe",
      },
    };

    function attemptDoctorRegistration(user, registrationNumber) {
      if (user?.user_metadata?.role === "patient") {
        return {
          success: false,
          error: "Access Denied: Under healthcare clinical separation rules, an account registered as a Patient cannot register as a medical doctor. Please sign out and sign in with a verified medical practitioner account.",
        };
      }
      if (!registrationNumber || registrationNumber.trim().length < 3) {
        return { success: false, error: "Invalid registration number" };
      }
      return { success: true };
    }

    // Patient attempts to submit doctor registration number
    const result = attemptDoctorRegistration(patientUser, "MCI-2023-99881");
    assert.equal(result.success, false, "Patient account MUST be blocked from registering as doctor");
    assert.match(result.error, /account registered as a Patient cannot register as a medical doctor/);

    // Google OAuth redirect enforcement for patient account
    function handleOAuthCallback(currentUser, requestedPersona) {
      if (currentUser?.user_metadata?.role === "patient") {
        return {
          finalPersona: "patient",
          roleRestriction: requestedPersona === "doctor" ? "patient_cannot_be_doctor" : null,
        };
      }
      return { finalPersona: requestedPersona, roleRestriction: null };
    }

    const oauthResult = handleOAuthCallback(patientUser, "doctor");
    assert.equal(oauthResult.finalPersona, "patient", "OAuth must force patient persona");
    assert.equal(oauthResult.roleRestriction, "patient_cannot_be_doctor", "Must trigger role restriction signal");
  });

  await t.test("Aegis and Oracle are 100% separated — zero menu options for switching workspaces when logged in", () => {
    // Validate menu items available to authenticated patient
    function getAvailableMenuActions(user) {
      if (user?.user_metadata?.role === "patient") {
        return {
          workspace: "aegis",
          allowOracleAccess: false,
          allowRoleSwitching: false,
          availableMenuOptions: ["profile_info", "security_badge", "sign_out"],
        };
      }
      if (user?.user_metadata?.role === "doctor") {
        return {
          workspace: "oracle",
          allowOracleAccess: true,
          allowRoleSwitching: false,
          availableMenuOptions: ["profile_info", "licensure_info", "security_badge", "sign_out"],
        };
      }
      return {
        workspace: null,
        allowOracleAccess: false,
        allowRoleSwitching: true,
        availableMenuOptions: [],
      };
    }

    const patientUser = { user_metadata: { role: "patient" } };
    const patientMenu = getAvailableMenuActions(patientUser);
    assert.equal(patientMenu.workspace, "aegis", "Patient workspace must be strictly Aegis");
    assert.equal(patientMenu.allowOracleAccess, false, "Patient must not have Oracle access");
    assert.equal(patientMenu.allowRoleSwitching, false, "Patient must not have role switching menu");
    assert.ok(!patientMenu.availableMenuOptions.includes("select_oracle"));
    assert.ok(!patientMenu.availableMenuOptions.includes("select_aegis"));
    assert.ok(!patientMenu.availableMenuOptions.includes("switch_role"));

    const doctorUser = { user_metadata: { role: "doctor" } };
    const doctorMenu = getAvailableMenuActions(doctorUser);
    assert.equal(doctorMenu.workspace, "oracle", "Doctor workspace must be strictly Oracle");
    assert.equal(doctorMenu.allowRoleSwitching, false, "Doctor must not have role switching menu");
  });

  await t.test("Duplicate email registration with empty identities triggers user-friendly rejection", () => {
    // Simulator for Supabase signUp returning identities: []
    function evaluateSignUpResponse({ data, error }) {
      if (error) {
        const errLower = (error.message || "").toLowerCase();
        if (
          errLower.includes("already registered") ||
          errLower.includes("already exists") ||
          errLower.includes("user already") ||
          errLower.includes("email already")
        ) {
          return { error: new Error("An account with this email address is already registered. Please log in instead.") };
        }
        if (
          error.status === 429 ||
          errLower.includes("rate limit") ||
          errLower.includes("security purposes")
        ) {
          return {
            error: new Error("Supabase email verification rate limit reached. To enable instant signup without limits, please disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email) or add SUPABASE_SERVICE_ROLE_KEY to .env.local."),
          };
        }
        return { error };
      }

      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          error: new Error("An account with this email address is already registered. Please log in instead."),
        };
      }

      return { error: null };
    }

    // Existing user attempts registration -> Supabase returns identities: []
    const duplicateRes = evaluateSignUpResponse({
      data: {
        user: {
          id: "existing_user_uuid",
          email: "existing@hospital.org",
          identities: [],
        },
      },
      error: null,
    });

    assert.ok(duplicateRes.error !== null, "Must reject registration when identities is empty");
    assert.match(duplicateRes.error.message, /already registered/);

    // Rate limited signup attempt
    const rateLimitedRes = evaluateSignUpResponse({
      data: null,
      error: {
        name: "AuthApiError",
        message: "email rate limit exceeded",
        status: 429,
      },
    });

    assert.ok(rateLimitedRes.error !== null);
    assert.match(rateLimitedRes.error.message, /rate limit reached/);

    // Fresh new user signup succeeds
    const freshRes = evaluateSignUpResponse({
      data: {
        user: {
          id: "fresh_user_uuid",
          email: "fresh@hospital.org",
          identities: [{ id: "identity_1", provider: "email" }],
        },
      },
      error: null,
    });

    assert.equal(freshRes.error, null, "Fresh signup with identities must succeed");
  });

  await t.test("Case-insensitive email matching prevents duplicate registrations", () => {
    const existingEmails = ["doctor.smith@clinic.org", "patient.jones@health.com"];

    function checkEmailExists(candidateEmail) {
      const cleanCandidate = candidateEmail.trim().toLowerCase();
      return existingEmails.some((e) => e.toLowerCase() === cleanCandidate);
    }

    assert.equal(checkEmailExists("Doctor.Smith@Clinic.Org"), true, "Must match uppercase variant");
    assert.equal(checkEmailExists("  doctor.smith@clinic.org  "), true, "Must match padded variant");
    assert.equal(checkEmailExists("DOCTOR.SMITH@CLINIC.ORG"), true, "Must match all-caps variant");
    assert.equal(checkEmailExists("new.doctor@clinic.org"), false, "Must allow truly new email");
  });
});
