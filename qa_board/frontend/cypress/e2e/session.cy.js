describe('Приєднання до існуючої сесії', () => {
  beforeEach(() => {
    cy.login()
  })

  it('повинен показувати помилку при спробі приєднатися з невалідним кодом сесії', () => {
    cy.contains('h3', 'Маєш код сесії?').should('be.visible')

    cy.get('.join-box input[type="text"]').type('XXXXXX')
    cy.get('.join-box button[type="submit"]').click()

    cy.get('.toast', { timeout: 6000 }).should('be.visible')
  })

  it('повинен відображати активні сесії та дозволяти перейти в одну з них', () => {
    cy.get('body').then($body => {
      if ($body.find('.badge-success').length > 0) {
        cy.contains('button', 'Continue').first().click()

        cy.url().should('include', '/session/')
        cy.contains('Прогрес').should('be.visible')
        cy.get('.session-sidebar').contains('КОД СЕСІЇ').should('be.visible')
      } else {
        cy.get('.survey-card', { timeout: 10000 }).should('have.length.greaterThan', 0)
        cy.get('.survey-card').first().within(() => {
          cy.get('.btn-primary').contains('Почати').click()
        })
        cy.url().should('include', '/survey/')
        cy.contains('button', 'Створити сесію').click()

        cy.url().should('include', '/session/', { timeout: 8000 })

        cy.get('.session-code-display').first().invoke('text').then(code => {
          const trimmedCode = code.trim()

          cy.contains('.navbar-brand', 'PawMatch').click()
          cy.url().should('include', '/dashboard')

          cy.contains(trimmedCode, { timeout: 6000 }).should('be.visible')

          cy.contains('button', 'Continue').first().click()
          cy.url().should('include', '/session/')
          cy.get('.session-sidebar').contains('КОД СЕСІЇ').should('be.visible')
        })
      }
    })
  })
})
