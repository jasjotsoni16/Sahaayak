// Offline provider: finds nothing. Used by the test suite (so tests never touch the network)
// and handy for running the backend without internet (GEOCODER=none).
exports.search = async () => [];
exports.reverse = async () => null;
