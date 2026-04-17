describe('Процес автентифікації', () => {
  it('повинен дозволяти користувачу увійти з правильними даними', () => {
    cy.visit('/static/login')
    cy.get('input[id="login-email"]').type('meona@gmail.com')
    cy.get('input[id="login-pass"]').type('01122003')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })
})
