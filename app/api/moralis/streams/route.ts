import { NextResponse } from 'next/server';
import Moralis from 'moralis';
import { initMoralis } from '@/lib/moralis-client';

// GET streams for an address
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ 
      success: false, 
      error: 'Wallet address is required' 
    }, { status: 400 });
  }

  try {
    await initMoralis();
    
    // Get all streams
    const streamsResponse = await Moralis.Streams.getAll({
      limit: 100
    });
    
    // Filter streams by address
    const addressStreams = streamsResponse.toJSON().streams.filter(
      (stream: any) => stream.tag === address || 
                      (stream.settings?.addresses || []).includes(address)
    );
    
    return NextResponse.json({
      success: true,
      data: {
        streams: addressStreams
      }
    });
    
  } catch (error) {
    console.error('Error fetching streams:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch streams'
    }, { status: 500 });
  }
}

// POST to create a new stream
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, webhookUrl, description, chains, events } = body;
    
    if (!address || !webhookUrl || !chains || !events) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters (address, webhookUrl, chains, events)'
      }, { status: 400 });
    }
    
    await initMoralis();
    
    // Create a new stream
    const stream = await Moralis.Streams.add({
      webhookUrl,
      description: description || `Stream for ${address}`,
      tag: address,
      chains, // Array of chain IDs, e.g. ["0x1", "0x89"]
      includeNativeTxs: true,
      includeContractLogs: true,
      includeInternalTxs: true,
      events // Array of event filters
    });
    
    // Add address to the stream
    await Moralis.Streams.addAddress({
      id: stream.toJSON().id,
      address
    });
    
    return NextResponse.json({
      success: true,
      data: stream.toJSON()
    });
    
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create stream'
    }, { status: 500 });
  }
}

// DELETE to remove a stream
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const streamId = searchParams.get('streamId');
  
  if (!streamId) {
    return NextResponse.json({ 
      success: false, 
      error: 'Stream ID is required' 
    }, { status: 400 });
  }

  try {
    await initMoralis();
    
    // Delete the stream
    const response = await Moralis.Streams.delete({
      id: streamId
    });
    
    return NextResponse.json({
      success: true,
      data: {
        deleted: response.toJSON()
      }
    });
    
  } catch (error) {
    console.error('Error deleting stream:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete stream'
    }, { status: 500 });
  }
} 