describe('Сторінка "Про додаток"', () => {
  beforeEach(() => {
    cy.login()
  })

  it('повинен переходити на сторінку "Про додаток" через навбар та відображати контент', () => {
    cy.contains('.nav-link', 'Про додаток').click()
    cy.url().should('include', '/about')
    cy.contains('Про додаток').should('be.visible')
    cy.contains('Використані технології').should('be.visible')
    cy.contains('React').should('be.visible')
    cy.contains('Django').should('be.visible')
  })
})
