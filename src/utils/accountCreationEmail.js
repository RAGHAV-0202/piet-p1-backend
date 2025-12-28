export const accountCreationEmail = ({
  fullName,
  email,
  employeeId,
  department,
  designation,
  bankAccount,
  ifsc
}) => {

  const maskedAccount = bankAccount.slice(-4).padStart(bankAccount.length, "*");
  const maskedIFSC = ifsc.slice(0, 4) + "****" + ifsc.slice(-3);

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f6f8;
        padding: 20px;
      }
      .container {
        background: #ffffff;
        padding: 25px;
        border-radius: 8px;
        max-width: 600px;
        margin: auto;
      }
      h2 {
        color: #2c3e50;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      td {
        padding: 8px 0;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #777;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <h2>Account Successfully Created 🎉</h2>

      <p>Dear <strong>${fullName}</strong>,</p>

      <p>Your account has been successfully created in our system. Below are the registered details:</p>

      <table>
        <tr>
          <td><strong>Email</strong></td>
          <td>${email}</td>
        </tr>
        <tr>
          <td><strong>Employee ID</strong></td>
          <td>${employeeId}</td>
        </tr>
        <tr>
          <td><strong>Department</strong></td>
          <td>${department}</td>
        </tr>
        <tr>
          <td><strong>Designation</strong></td>
          <td>${designation}</td>
        </tr>
        <tr>
          <td><strong>Bank Account</strong></td>
          <td>${maskedAccount}</td>
        </tr>
        <tr>
          <td><strong>IFSC Code</strong></td>
          <td>${maskedIFSC}</td>
        </tr>
      </table>

      <p>If any of the above information is incorrect, please contact the administrator immediately.</p>

      <p class="footer">
        This is an automated email. Please do not reply.
      </p>
    </div>
  </body>
  </html>
  `;
};
