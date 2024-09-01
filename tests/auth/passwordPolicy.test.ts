import {
  PasswordPolicyEnforcer,
  isPasswordCommon,
  PasswordPolicyConfig,
} from "../../src/auth/passwordPolicy";
import zxcvbn from "zxcvbn";
import { getConfig } from "../../src/utils/config";

jest.mock("../../src/utils/config");
jest.mock("zxcvbn");

describe("Password Policy Enforcer", () => {
  let enforcer: PasswordPolicyEnforcer;
  let mockIsPasswordCommon: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPasswordCommon = jest.fn().mockResolvedValue(false);

    (getConfig as jest.Mock).mockReturnValue({
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxConsecutiveRepeats: 3,
        minStrengthScore: 3,
      },
    });

    class TestPasswordPolicyEnforcer extends PasswordPolicyEnforcer {
      constructor(config?: Partial<PasswordPolicyConfig>) {
        super(config);
        (this as any).isPasswordCommon = mockIsPasswordCommon;
      }
    }

    enforcer = new TestPasswordPolicyEnforcer();
    (zxcvbn as jest.Mock).mockReturnValue({ score: 4 });
  });

  test("accepts strong password", async () => {
    const errors = await enforcer.enforcePolicy("StrongP@ssw0rd!9872!£");
    expect(errors).toHaveLength(0);
  });
  test("rejects short password", async () => {
    const errors = await enforcer.enforcePolicy("Weak1!");
    expect(errors).toContain("Password must be at least 8 characters long.");
  });

  test("requires uppercase letter", async () => {
    const errors = await enforcer.enforcePolicy("weakpassw0rd!");
    expect(errors).toContain(
      "Password must contain at least one uppercase letter."
    );
  });

  test("requires lowercase letter", async () => {
    const errors = await enforcer.enforcePolicy("STRONGP@SSW0RD");
    expect(errors).toContain(
      "Password must contain at least one lowercase letter."
    );
  });

  test("requires number", async () => {
    const errors = await enforcer.enforcePolicy("StrongP@ssword");
    expect(errors).toContain("Password must contain at least one number.");
  });

  test("requires special character", async () => {
    const errors = await enforcer.enforcePolicy("StrongPassw0rd");
    expect(errors).toContain(
      "Password must contain at least one special character."
    );
  });

  test("rejects password with too many consecutive repeats", async () => {
    const errors = await enforcer.enforcePolicy("StrongP@ssssw0rd");
    expect(errors).toContain(
      "Password must not contain more than 3 consecutive repeating characters."
    );
  });

  test("rejects common password", async () => {
    mockIsPasswordCommon.mockResolvedValue(true);
    const errors = await enforcer.enforcePolicy("StrongP@ssw0rd");
    expect(errors).toContain(
      "This password has been exposed in data breaches. Please choose a different password."
    );
  });

  test("rejects weak password", async () => {
    (zxcvbn as jest.Mock).mockReturnValue({ score: 2 });
    const errors = await enforcer.enforcePolicy("StrongP@ssw0rd");
    expect(errors).toContain(
      "Password is too weak. Please choose a stronger password."
    );
  });

  test("accepts custom configuration", async () => {
    const customEnforcer = new PasswordPolicyEnforcer({
      minLength: 6,
      requireUppercase: false,
      requireSpecialChars: false,
      maxConsecutiveRepeats: 5,
    });
    const errors = await customEnforcer.enforcePolicy("weakpassw0rddddd");
    expect(errors).toHaveLength(0);
  });
});
