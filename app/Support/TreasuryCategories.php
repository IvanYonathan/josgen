<?php

namespace App\Support;

/**
 * Configuration for Treasury categories.
 * Centralized location for income and expense categories.
 */
class TreasuryCategories
{
    /**
     * Expense categories for treasury requests and financial records.
     */
    public static function expenseCategories(): array
    {
        return [
            'transportation' => 'Transportation',
            'food' => 'Food & Beverages',
            'supplies' => 'Supplies & Materials',
            'equipment' => 'Equipment',
            'venue' => 'Venue & Rental',
            'printing' => 'Printing & Stationery',
            'communication' => 'Communication',
            'utilities' => 'Utilities',
            'maintenance' => 'Maintenance',
            'salary' => 'Salary/Honorarium',
            'insurance' => 'Insurance',
            'tax' => 'Tax/Fees',
            'other' => 'Other',
        ];
    }

    /**
     * Income categories for financial records.
     */
    public static function incomeCategories(): array
    {
        return [
            'donation' => 'Donation',
            'offering' => 'Offering',
            'fundraising' => 'Fundraising',
            'grant' => 'Grant',
            'sponsorship' => 'Sponsorship',
            'membership' => 'Membership Fee',
            'sales' => 'Sales/Merchandise',
            'interest' => 'Interest/Investment',
            'reimbursement_return' => 'Reimbursement Return',
            'other_income' => 'Other Income',
        ];
    }

    /**
     * Get all categories.
     */
    public static function all(): array
    {
        return [
            'income' => self::incomeCategories(),
            'expense' => self::expenseCategories(),
        ];
    }
}
