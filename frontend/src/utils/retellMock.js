// Mock implementation of Retell SDK for development
// Use this if the retell-client-js-sdk package causes build issues

class MockRetellWebClient {
  constructor(options = {}) {
    this.options = options;
    this.isConnected = false;
    console.log('MockRetellWebClient initialized with options:', options);
  }

  async startCall(callConfig) {
    console.log('Mock: Starting call with config:', callConfig);
    this.isConnected = true;
    
    // Simulate connection success
    if (this.options.onConnect) {
      setTimeout(() => {
        this.options.onConnect();
      }, 1000);
    }

    return {
      success: true,
      callId: 'mock-call-' + Date.now(),
      message: 'Mock call started successfully'
    };
  }

  async endCall() {
    console.log('Mock: Ending call');
    this.isConnected = false;
    
    if (this.options.onDisconnect) {
      this.options.onDisconnect();
    }

    return {
      success: true,
      message: 'Mock call ended successfully'
    };
  }

  async toggleMute() {
    console.log('Mock: Toggling mute');
    return {
      success: true,
      muted: !this.muted
    };
  }

  getConnectionStatus() {
    return this.isConnected ? 'connected' : 'disconnected';
  }
}

// Export the mock class
export { MockRetellWebClient };

// Default export for easy replacement
export default MockRetellWebClient;