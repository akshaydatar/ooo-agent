# Workflow: /visual-check
**Goal**: Verify UI integrity and accessibility via the integrated browser.

1. **Environment Check**: Ensure the local dev server is running. If not, run the start command.
2. **Browser Navigation**: Open the integrated browser to the local URL (e.g., localhost:3000).
3. **Responsive Audit**: 
   - Resize the viewport to Mobile, Tablet, and Desktop dimensions.
   - Take a screenshot artifact for each.
4. **Interaction Recording**: 
   - Perform the core user journey (e.g., "Click Login," "Fill Form").
   - Generate a 'Browser Recording' artifact.
5. **Validation**: Compare current UI against the `design_style.md` rule.
6. **Reporting**: Flag any layout shifts, color contrast issues, or broken links.
