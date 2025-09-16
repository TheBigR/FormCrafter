import { NextRequest, NextResponse } from 'next/server';
import { FormsService } from '@/lib/forms';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const form = await FormsService.getFormBySlug(slug);
    
    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const form = await FormsService.getFormBySlug(slug);
    
    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { data } = body;

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const errors: string[] = [];
    form.fields.forEach(field => {
      if (field.required) {
        const value = data[field.id];
        if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
          errors.push(`${field.label} is required`);
        }
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Get client info
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const submission = await FormsService.submitForm({
      form_id: form.id,
      data,
      ip_address: ip,
      user_agent: userAgent,
    });

    return NextResponse.json(
      { message: 'Form submitted successfully', submissionId: submission.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}
