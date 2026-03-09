<?php

require_once __DIR__ . '/env.php';
require_once __DIR__ . '/../PHPMailer-master/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer-master/src/SMTP.php';
require_once __DIR__ . '/../PHPMailer-master/src/Exception.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

loadServerEnv(__DIR__ . '/.env');

function sendSignupOtpEmail($toEmail, $firstName, $otpCode)
{
    $appPassword = getenv('GMAIL_APP_PASSWORD');
    if (!$appPassword) {
        return [
            'success' => false,
            'message' => 'Mail server is not configured. Set GMAIL_APP_PASSWORD in server/.env.'
        ];
    }

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'alkristian61@gmail.com';
        $mail->Password = $appPassword;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('alkristian61@gmail.com', 'Library System');
        $mail->addAddress($toEmail, $firstName ?: 'Student');

        $mail->isHTML(true);
        $mail->Subject = 'Your Library Signup OTP';
        $mail->Body = '<p>Hello ' . htmlspecialchars($firstName ?: 'Student') . ',</p>'
            . '<p>Your OTP for signup is:</p>'
            . '<h2 style="letter-spacing:2px;">' . htmlspecialchars($otpCode) . '</h2>'
            . '<p>This code expires in 5 minutes.</p>';
        $mail->AltBody = "Your OTP for signup is: {$otpCode}. It expires in 5 minutes.";

        $mail->send();
        return ['success' => true];
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Failed to send OTP email. ' . $mail->ErrorInfo
        ];
    }
}

function sendPasswordResetOtpEmail($toEmail, $firstName, $otpCode)
{
    $appPassword = getenv('GMAIL_APP_PASSWORD');
    if (!$appPassword) {
        return [
            'success' => false,
            'message' => 'Mail server is not configured. Set GMAIL_APP_PASSWORD in server/.env.'
        ];
    }

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'alkristian61@gmail.com';
        $mail->Password = $appPassword;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('alkristian61@gmail.com', 'Library System');
        $mail->addAddress($toEmail, $firstName ?: 'Student');

        $mail->isHTML(true);
        $mail->Subject = 'Your Password Reset OTP';
        $mail->Body = '<p>Hello ' . htmlspecialchars($firstName ?: 'Student') . ',</p>'
            . '<p>Your OTP for password reset is:</p>'
            . '<h2 style="letter-spacing:2px;">' . htmlspecialchars($otpCode) . '</h2>'
            . '<p>This code expires in 5 minutes.</p>';
        $mail->AltBody = "Your OTP for password reset is: {$otpCode}. It expires in 5 minutes.";

        $mail->send();
        return ['success' => true];
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Failed to send password reset OTP email. ' . $mail->ErrorInfo
        ];
    }
}

