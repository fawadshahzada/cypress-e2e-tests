import ForgotPasswordPage from '../pages/forgot_password_page'

describe('Forgot password page tests', function () {
  const forgotPasswordPage = new ForgotPasswordPage()

  beforeEach(function () {
    cy.visit('/reset')
  })

  it('should show empty field error message', function () {
    forgotPasswordPage.clickSubmit()
    forgotPasswordPage.forgotPasswordFailureError().should('contain.text', 'We were unable to contact you')
    forgotPasswordPage.forgotPasswordFailureError().should('contain.text', 'Enter your email below')
  })

  it('should show invalid format error message', function () {
    forgotPasswordPage.sendForgotPasswordEmail('invalid')
    forgotPasswordPage.forgotPasswordFailureError().should('contain.text', 'We were unable to contact you')
    forgotPasswordPage.forgotPasswordFailureError().should('contain.text', 'Enter a valid email address below')
  })

  it('user can see the success message on login page', function () {
    const emailID = `${(Math.random() * 1e20).toString(36)}@example.com`
    forgotPasswordPage.sendForgotPasswordEmail(emailID)
    forgotPasswordPage.forgotPasswordSuccessMessage().should('contain.text', emailID)
    forgotPasswordPage.forgotPasswordSuccessMessage().should('contain.text', 'Check your email')
  })
})
