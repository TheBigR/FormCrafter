import { sql } from './db';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  submitted_at: string;
}

export class FormsService {
  // Create a new form
  static async createForm(data: {
    title: string;
    description?: string;
    fields: FormField[];
    slug: string;
  }): Promise<Form> {
    const [form] = await sql`
      INSERT INTO forms (title, description, fields, slug)
      VALUES (${data.title}, ${data.description}, ${JSON.stringify(data.fields)}, ${data.slug})
      RETURNING *
    `;
    return form;
  }

  // Get all forms
  static async getAllForms(): Promise<Form[]> {
    return await sql`
      SELECT * FROM forms 
      ORDER BY updated_at DESC
    `;
  }

  // Get form by ID
  static async getFormById(id: string): Promise<Form | null> {
    const [form] = await sql`
      SELECT * FROM forms WHERE id = ${id}
    `;
    return form || null;
  }

  // Get form by slug
  static async getFormBySlug(slug: string): Promise<Form | null> {
    const [form] = await sql`
      SELECT * FROM forms 
      WHERE slug = ${slug} AND is_active = true
    `;
    return form || null;
  }

  // Update form
  static async updateForm(id: string, data: Partial<Form>): Promise<Form | null> {
    const [form] = await sql`
      UPDATE forms 
      SET 
        title = COALESCE(${data.title}, title),
        description = COALESCE(${data.description}, description),
        fields = COALESCE(${JSON.stringify(data.fields)}, fields),
        slug = COALESCE(${data.slug}, slug),
        is_active = COALESCE(${data.is_active}, is_active)
      WHERE id = ${id}
      RETURNING *
    `;
    return form || null;
  }

  // Delete form
  static async deleteForm(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM forms WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Submit form data
  static async submitForm(data: {
    form_id: string;
    data: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }): Promise<FormSubmission> {
    const [submission] = await sql`
      INSERT INTO form_submissions (form_id, data, ip_address, user_agent)
      VALUES (${data.form_id}, ${JSON.stringify(data.data)}, ${data.ip_address}, ${data.user_agent})
      RETURNING *
    `;
    return submission;
  }

  // Get submissions for a form
  static async getFormSubmissions(formId: string): Promise<FormSubmission[]> {
    return await sql`
      SELECT * FROM form_submissions 
      WHERE form_id = ${formId}
      ORDER BY submitted_at DESC
    `;
  }

  // Get all submissions
  static async getAllSubmissions(): Promise<FormSubmission[]> {
    return await sql`
      SELECT fs.*, f.title as form_title 
      FROM form_submissions fs
      JOIN forms f ON fs.form_id = f.id
      ORDER BY fs.submitted_at DESC
    `;
  }

  // Get form statistics
  static async getFormStats(): Promise<{
    totalForms: number;
    totalSubmissions: number;
    activeForms: number;
  }> {
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total_forms,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_forms
      FROM forms
    `;

    const [submissionCount] = await sql`
      SELECT COUNT(*) as total_submissions FROM form_submissions
    `;

    return {
      totalForms: Number(stats.total_forms),
      totalSubmissions: Number(submissionCount.total_submissions),
      activeForms: Number(stats.active_forms),
    };
  }
}
