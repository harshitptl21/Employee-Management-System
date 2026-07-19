import { createEmployeeSchema, updateEmployeeSchema } from '@/validators/employee.validator';

describe('createEmployeeSchema', () => {
  const base = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'Password123',
  };

  it('accepts a valid payload', () => {
    const result = createEmployeeSchema.safeParse({ body: base });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = createEmployeeSchema.safeParse({ body: { ...base, email: 'not-an-email' } });
    expect(result.success).toBe(false);
  });

  it('rejects a negative salary', () => {
    const result = createEmployeeSchema.safeParse({ body: { ...base, salary: -500 } });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid phone number', () => {
    const result = createEmployeeSchema.safeParse({ body: { ...base, phone: 'call-me-maybe' } });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = createEmployeeSchema.safeParse({ body: { ...base, password: 'short' } });
    expect(result.success).toBe(false);
  });

  it('accepts a valid phone number with country code', () => {
    const result = createEmployeeSchema.safeParse({ body: { ...base, phone: '+15551234567' } });
    expect(result.success).toBe(true);
  });

  it('accepts an absolute URL for profileImageUrl', () => {
    const result = createEmployeeSchema.safeParse({
      body: { ...base, profileImageUrl: 'https://example.com/avatar.png' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a relative /uploads path for profileImageUrl', () => {
    const result = createEmployeeSchema.safeParse({
      body: { ...base, profileImageUrl: '/uploads/some-id.png' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a profileImageUrl that is neither an absolute URL nor an /uploads path', () => {
    const result = createEmployeeSchema.safeParse({
      body: { ...base, profileImageUrl: 'not-a-real-path' },
    });
    expect(result.success).toBe(false);
  });

  // Regression: the frontend used to send phone: '' for employees with no
  // phone on file, which fails the format regex below even though the
  // field itself is optional — omitting the key entirely is required.
  it('rejects an empty string for phone (optional means omitted, not blank)', () => {
    const result = createEmployeeSchema.safeParse({ body: { ...base, phone: '' } });
    expect(result.success).toBe(false);
  });

  it('accepts a payload with the phone key omitted entirely', () => {
    const result = createEmployeeSchema.safeParse({ body: base });
    expect(result.success).toBe(true);
  });
});

describe('updateEmployeeSchema', () => {
  const params = { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' };

  it('accepts a partial update with only one field', () => {
    const result = updateEmployeeSchema.safeParse({ params, body: { department: 'Engineering' } });
    expect(result.success).toBe(true);
  });

  it('accepts an empty body (no-op update)', () => {
    const result = updateEmployeeSchema.safeParse({ params, body: {} });
    expect(result.success).toBe(true);
  });

  // Same regression as above, but for the update path an admin/HR would
  // actually hit when editing an employee that has no phone on file.
  it('rejects an empty string for phone on update', () => {
    const result = updateEmployeeSchema.safeParse({ params, body: { phone: '' } });
    expect(result.success).toBe(false);
  });

  // The actual "clear a field" feature: null is how the frontend now
  // expresses "the user blanked this out", distinct from omitting the key
  // (leave unchanged) and from an empty string (still invalid).
  it('accepts explicit null to clear nullable fields', () => {
    const result = updateEmployeeSchema.safeParse({
      params,
      body: { phone: null, department: null, designation: null, salary: null, joiningDate: null },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid id param', () => {
    const result = updateEmployeeSchema.safeParse({ params: { id: 'not-a-uuid' }, body: {} });
    expect(result.success).toBe(false);
  });
});
