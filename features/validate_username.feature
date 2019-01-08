Feature: Validate
  Scenario: username Pin
    Given The username "Pin"
    When I validate
    Then I end up with false

  Scenario: username Pina
    Given I start with "Pina"
    When I validate
    Then I end up with true