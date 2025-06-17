import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { projectId: string } }
) {
  const projectId = context.params.projectId
}

export async function PUT(
  request: NextRequest,
  context: { params: { projectId: string } }
) {
  const projectId = context.params.projectId
}

export async function DELETE(
  request: NextRequest,
  context: { params: { projectId: string } }
) {
  const projectId = context.params.projectId
} 