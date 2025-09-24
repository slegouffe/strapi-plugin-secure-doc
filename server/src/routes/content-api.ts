export default [
  {
    method: 'GET',
    path: '/check/:email/:docId',
    handler: 'controller.check',
    config: {
      auth: false,
      policies: [
      ],
    },
  },
  {
    method: 'POST',
    path: '/verify-otp',
    handler: 'controller.verifyOtp',
    config: {
      auth: false,
      policies: [
      ],
    },
  },
];
