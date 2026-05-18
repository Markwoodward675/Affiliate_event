import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { scriptName } = await request.json();

    if (!scriptName) {
      return NextResponse.json({ error: 'Script name is required' }, { status: 400 });
    }

    console.log(`Admin requested to run script: ${scriptName}`);

    let scriptPath = '';
    switch (scriptName) {
      case 'setup':
        scriptPath = 'scripts/setup-appwrite.js';
        break;
      case 'permissions':
        scriptPath = 'scripts/update-permissions.js';
        break;
      case 'seed':
        scriptPath = 'scripts/seed-tasks.js';
        break;
      case 'seed-user-tasks':
        scriptPath = 'scripts/seed-user-tasks.js';
        break;
      case 'add-free-mining-attribute':
        scriptPath = 'scripts/add-free-mining-attribute.js';
        break;
      default:
        return NextResponse.json({ error: 'Unknown script' }, { status: 400 });
    }

    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
    const output = stdout + (stderr ? '\n\n' + stderr : '');

    return NextResponse.json({
      success: true,
      message: output,
      note: 'Script execution completed'
    });
  } catch (error: any) {
    console.error('Error running admin script:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run script' },
      { status: 500 }
    );
  }
}
