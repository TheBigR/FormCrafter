import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET - Get a specific form for management
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: formId } = await params;
    
    // Get the form and check ownership
    const [form] = await sql`
      SELECT * FROM forms WHERE id = ${formId}
    `;

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if user is the creator of the form
    const [user] = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (!user || form.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only access your own forms' },
        { status: 403 }
      );
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: formId } = await params;
    
    // Get the form to check ownership
    const [form] = await sql`
      SELECT * FROM forms WHERE id = ${formId}
    `;

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if user is the creator of the form
    const [user] = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (!user || form.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own forms' },
        { status: 403 }
      );
    }

    // Delete all submissions for this form first (due to foreign key constraint)
    await sql`
      DELETE FROM form_submissions WHERE form_id = ${formId}
    `;

    // Delete the form
    await sql`
      DELETE FROM forms WHERE id = ${formId}
    `;

    return NextResponse.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    );
  }
}

// PUT - Update a form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: formId } = await params;
    const body = await request.json();
    const { title, description, fields, privacy_level, allowed_emails } = body;

    // Validate required fields
    if (!title || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'Title and fields are required' },
        { status: 400 }
      );
    }

    // Get the form to check ownership
    const [form] = await sql`
      SELECT * FROM forms WHERE id = ${formId}
    `;

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if user is the creator of the form
    const [user] = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (!user || form.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own forms' },
        { status: 403 }
      );
    }

    // Update the form
    await sql`
      UPDATE forms 
      SET 
        title = ${title},
        description = ${description || ''},
        fields = ${JSON.stringify(fields)},
        privacy_level = ${privacy_level || 'public'},
        allowed_emails = ${JSON.stringify(allowed_emails || [])},
        updated_at = NOW()
      WHERE id = ${formId}
    `;

    return NextResponse.json({ message: 'Form updated successfully' });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    );
  }
}
