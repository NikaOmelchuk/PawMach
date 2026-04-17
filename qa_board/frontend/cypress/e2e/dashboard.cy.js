describe('Сторінка дашборду', () => {
  beforeEach(() => {
    cy.login()
  })

  it('повинен успішно відображати категорії', () => {
    cy.contains('Категорії', { matchCase: false }).should('be.visible')
  })
})
