describe('Флоу опитування та сесії', () => {
  beforeEach(() => {
    cy.login()
  })

  it('повинен відкривати сторінку опитування та відображати його деталі', () => {
    cy.get('.survey-card', { timeout: 10000 }).should('have.length.greaterThan', 0)

    cy.get('.survey-card').first().within(() => {
      cy.get('.btn-primary').contains('Почати').click()
    })

    cy.url().should('include', '/survey/')

    cy.contains('Питання опитування').should('be.visible')

    cy.get('.card').contains('Питання опитування')
      .parents('.card')
      .find('div[style*="border-bottom"]')
      .should('have.length.greaterThan', 0)
  })

  it('повинен створювати сесію зі сторінки опитування та відповідати на перші 3 питання', () => {

    cy.get('.survey-card', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('.survey-card').first().within(() => {
      cy.get('.btn-primary').contains('Почати').click()
    })
    cy.url().should('include', '/survey/')

    cy.contains('button', 'Створити сесію').click()
    cy.url().should('include', '/session/', { timeout: 8000 })

    cy.contains('Прогрес').should('be.visible')

    cy.get('.card').contains('Питання 1').should('be.visible')
    answerCurrentQuestion()

    cy.contains('button', 'Далі').click()
    cy.contains('Питання 2').should('be.visible')
    answerCurrentQuestion()

    cy.contains('button', 'Далі').click()
    cy.contains('Питання 3').should('be.visible')
    answerCurrentQuestion()

    cy.get('span').contains(/^3 \/ \d+$/).should('be.visible')
  })


  function answerCurrentQuestion() {
    cy.get('.card').then($card => {
      if ($card.find('.option-btn').length > 0) {
        cy.get('.option-btn').first().click()
      }
    })
  }
})
