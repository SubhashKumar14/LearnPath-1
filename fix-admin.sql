-- Fix admin password hash
UPDATE users SET password = '$2b$10$UW6USd49NlM.pyqvgrr/JeLxCLxrXUJ2A0J5ZGhukjTzlr/I1vg6G' WHERE email = 'admin@learnpath.com';
