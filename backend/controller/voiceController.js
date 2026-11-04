
const handleCommand = (req, res) => {
  const { command } = req.body;
  const lowerCaseCommand = command.toLowerCase();

  let response = {
    action: 'speak',
    message: "I'm sorry, I didn't understand that command."
  };

  if (lowerCaseCommand.includes('upload document')) {
    response = {
      action: 'navigate',
      path: '/upload-document', // Assuming this route exists on the frontend
      message: 'Opening the document upload page.'
    };
  } else if (lowerCaseCommand.includes('apply for a job')) {
    response = {
      action: 'navigate',
      path: '/jobs',
      message: 'Showing available jobs.'
    };
  } else if (lowerCaseCommand.includes('open my profile')) {
    response = {
      action: 'navigate',
      path: '/profile',
      message: 'Opening your profile.'
    };
  } else if (lowerCaseCommand.includes('show my skills')) {
    response = {
      action: 'navigate',
      path: '/skills',
      message: 'Opening your skills page.'
    };
  } else if (lowerCaseCommand.includes('check my salary')) {
    response = {
      action: 'navigate',
      path: '/salary',
      message: 'Opening your salary records.'
    };
  } else {
    response = {
      action: 'speak',
      message: "I'm sorry, I didn't understand that command."
    };
  }

  res.json(response);
};

module.exports = { handleCommand };
