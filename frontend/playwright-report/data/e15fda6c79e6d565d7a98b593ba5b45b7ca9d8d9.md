# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - heading "WealthTrack" [level=1] [ref=e5]
      - navigation [ref=e6]:
        - link "Home" [ref=e7] [cursor=pointer]:
          - /url: "#"
        - link "Register" [ref=e8] [cursor=pointer]:
          - /url: "#"
        - link "Login" [ref=e9] [cursor=pointer]:
          - /url: "#"
  - main [ref=e10]:
    - generic [ref=e13]:
      - heading "Login to Your Account" [level=2] [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Email
          - textbox "Email" [ref=e18]:
            - /placeholder: your.email@example.com
            - text: user@example.com
        - generic [ref=e19]:
          - generic [ref=e20]: Password
          - textbox "Password" [ref=e21]:
            - /placeholder: Your password
          - generic [ref=e22]: Password is required
        - button "Login" [active] [ref=e23] [cursor=pointer]
      - paragraph [ref=e24]:
        - text: Don't have an account?
        - link "Register here" [ref=e25] [cursor=pointer]:
          - /url: "#"
  - contentinfo [ref=e26]:
    - paragraph [ref=e28]: © 2026 WealthTrack. All rights reserved.
```