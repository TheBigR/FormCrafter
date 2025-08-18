import { NextRequest, NextResponse } from 'next/server';
import { FormsService } from '@/lib/forms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, fields } = body;

    // Validate required fields
    if (!title || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'Title and fields are required' },
        { status: 400 }
      );
    }

    // Generate a URL-friendly slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString().slice(-6);

    const form = await FormsService.createForm({
      title,
      description,
      fields,
      slug,
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error('Error saving form:', error);
    return NextResponse.json(
      { error: 'Failed to save form' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const forms = await FormsService.getAllForms();
    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}
