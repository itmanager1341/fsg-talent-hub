# Platform Settings

## Overview
The settings module allows admins to configure platform-wide settings, manage feature flags, and control system behavior. This is the control center for platform configuration.

## Access
- **Who**: Admins only
- **Location**: `/admin/settings`
- **Requirements**: Admin role required

## Current Features

### Feature Flags
- Toggle features on/off
- Control feature availability
- A/B testing support
- Gradual feature rollouts
- Feature-specific settings

### Platform Configuration
- System-wide settings
- Default values
- Integration settings
- Email configuration
- Notification settings

### Feature Flag Management
- View all feature flags
- Toggle flags on/off
- Set flag values
- Flag descriptions
- Impact assessment

## How It Works

1. **Feature Flags**
   - Flags stored in database or environment
   - Checked at application level
   - Can enable/disable features instantly
   - No code deployment needed

2. **Settings Management**
   - Settings stored in database
   - Changes take effect immediately
   - Some settings may require restart
   - Settings validated before saving

3. **Configuration Updates**
   - Admin updates setting
   - Change saved to database
   - Application reads new value
   - Feature behavior updates

## Technical Details

- **Key components**: 
  - `src/app/admin/settings/page.tsx` - Settings page
  - `src/app/admin/settings/FeatureFlagToggle.tsx` - Feature flag component
- **Server actions**: 
  - `src/app/admin/settings/actions.ts` - Update settings
- **Database tables**: 
  - `feature_flags` - Feature flag values (if exists)
  - `platform_settings` - Platform configuration (if exists)

## User Roles & Permissions

- **Admin**: Full access to settings
- **Non-Admin**: Cannot access

## FAQ Items

**Q: What are feature flags used for?**
A: Feature flags allow you to enable/disable features without code changes. Useful for testing, gradual rollouts, or temporarily disabling features.

**Q: Can I break the platform by changing settings?**
A: Some settings are critical. Always test changes in a staging environment first. Critical settings may have safeguards.

**Q: Do setting changes require a restart?**
A: Most settings take effect immediately. Some system-level settings may require an application restart. Check the setting description.

**Q: Can I see what changed in settings?**
A: Settings change history may be logged. Full audit trails may be added in future releases.

**Q: How do I revert a setting change?**
A: Simply change the setting back to its previous value. If you're unsure, contact support or check documentation.

**Q: Are there default settings?**
A: Yes, the platform has sensible defaults. Only change settings if you understand the impact.

## Related Features

- [Dashboard](./OVERVIEW.md) - Admin overview
- [AI Usage](./AI_USAGE.md) - AI-related settings

## Future Enhancements

- [ ] Settings change history
- [ ] Settings import/export
- [ ] Settings templates
- [ ] Environment-specific settings
- [ ] Settings validation rules
- [ ] Settings documentation
- [ ] Rollback functionality
- [ ] Settings search
- [ ] Bulk settings updates
- [ ] Settings categories/organization

