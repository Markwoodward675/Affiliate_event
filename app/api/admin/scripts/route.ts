import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { scriptName } = await request.json();

    if (!scriptName) {
      return NextResponse.json({ error: 'Script name is required' }, { status: 400 });
    }

    console.log(`Admin requested to run script: ${scriptName}`);

    let message = '';
    let scriptPath = '';
    switch (scriptName) {
      case 'setup':
        scriptPath = 'scripts/setup-appwrite.js';
        message = 'Database setup script would run here';
        break;
      case 'permissions':
        scriptPath = 'scripts/update-permissions.js';
        message = 'Permissions update script would run here';
        break;
      case 'seed':
        scriptPath = 'scripts/seed-tasks.js';
        message = 'Task seeding script would run here';
        break;
      case 'seed-user-tasks':
        scriptPath = 'scripts/seed-user-tasks.js';
        message = 'User tasks seeding script would run here';
        break;
      case 'add-free-mining-attribute':
        scriptPath = 'scripts/add-free-mining-attribute.js';
        message = 'Add free mining attribute script would run here';
        break;
      default:
        return NextResponse.json({ error: 'Unknown script' }, { status: 400 });
    }

    // Check if we're running locally - only try to execute scripts in local development
    const isLocal = process.env.NODE_ENV === 'development' && process.env.VERCEL_ENV !== 'production';
    
    if (isLocal) {
      try {
        // Only import these modules in local development
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execPromise = promisify(exec);
        
        const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
        const output = stdout + (stderr ? '\n\n' + stderr : '');
        
        return NextResponse.json({
          success: true,
          message: output,
          note: 'Script execution completed'
        });
      } catch (execError) {
        console.error('Error executing script:', execError);
        return NextResponse.json(
          { error: 'Failed to execute script locally' },
          { status: 500 }
        );
      }
    }

    // For production (Vercel), just return a message
    return NextResponse.json({
      success: true,
      message: message,
      note: 'For security, scripts must be run manually from terminal in production'
    });
  } catch (error: any) {
    console.error('Error running admin script:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run script' },
      { status: 500 }
    );
  }
}
